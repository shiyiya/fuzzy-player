import Player, { $ } from '@oplayer/core'
import { Icons } from '../functions/icons'
import { icon, settingShown, tooltip } from '../style'
import type { Setting, UiConfig } from '../types'
import { siblings } from '../utils'
import { controllerBottom } from './ControllerBottom.style'
import {
  activeCls,
  nextIcon,
  nextLabelText,
  panelCls,
  setting,
  settingItemCls,
  settingItemLeft,
  settingItemRight,
  subPanelCls,
  yesIcon,
  switcherCls,
  switcherContainer,
  BackIcon,
  backRow
} from './Setting.style'

const arrowSvg = (className = nextIcon) =>
  `<svg class="${className}"  xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 32 32"><path d="m 12.59,20.34 4.58,-4.59 -4.58,-4.59 1.41,-1.41 6,6 -6,6 z" fill="#fff"></path></svg>`

// Selector Options
export const selectorOption = (name: string, icon: string = '') =>
  `<div class="${settingItemLeft}">
      ${icon}
      <span>${name}</span>
    </div>
    <svg class=${yesIcon} xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 24 24">
      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="#fff"></path>
    </svg>
`

export const nexter = (name: string, icon: string = '') =>
  `<div class="${settingItemLeft}">
      ${icon}
      <span>${name}</span>
    </div>
    <div class=${settingItemRight}>
      <span role="label" class=${nextLabelText}></span>
      ${arrowSvg()}
    </div>
`

export const back = (name: string) =>
  `<div class="${backRow}">
      ${arrowSvg(BackIcon)}
      <span>${name}</span>
    </div>
`

export const switcher = (name: string, icon: string = '') =>
  `<div class="${settingItemLeft}">
    ${icon}
    <span>${name}</span>
  </div>
  <div class=${settingItemRight}>
    <label class=${switcherContainer}>
      <span class=${switcherCls}></span>
    </label>
  </div>
`

function createRow({
  type,
  key,
  name,
  icon,
  default: selected,
  index
}: Omit<Setting, 'onChange' | 'children' | 'value'> & { index?: number; switcherLabe?: string }) {
  let $item: HTMLElement = $.create(`div.${settingItemCls}`, {
    'data-key': key
  })
  const res = {
    $row: $item,
    $label: undefined as unknown as HTMLElement
  }

  switch (type) {
    case 'switcher':
      $item.innerHTML = switcher(name, icon)
      $item.setAttribute('data-selected', selected || false)
      break
    case 'selector':
      $item.innerHTML = nexter(name, icon)
      res['$label'] = $item.querySelector('span[role="label"]')!
      break
    case 'back' as any:
      $item.innerHTML = back(name)
      break
    default: // select option 不用 type
      $item.innerHTML = selectorOption(name, icon)
      $item.setAttribute('data-selected', selected || false)
      if (typeof index == 'number') {
        $item.setAttribute('data-index', index.toString())
      }
      break
  }

  return res
}

export type Panel = {
  $ref: HTMLElement
  key: string
  select?: Function // 全是选项才有
  parent?: Panel
}

function createPanel(
  player: Player,
  panels: Panel[],
  setting: Setting[],
  options: {
    /**
     * 全是选项面板的用上一个面板的key
     */
    key?: string
    name?: string
    target: HTMLElement
    parent?: Panel
    isSelectorOptionsPanel?: boolean
  } = {} as any
): Panel | void {
  if (!setting || setting.length == 0) return
  const { key: parentKey, target, parent, isSelectorOptionsPanel, name } = options

  let panel = {} as Panel
  let key: string = parentKey! || 'root'

  if (panels[0] && key == 'root') {
    panel = panels[0]! // 将 options 挂在第一个面板
    key = panels[0]!.key
  } else {
    //创建新的选项面板
    panel.$ref = $.create(`div.${panels[0] && isSelectorOptionsPanel ? subPanelCls : panelCls}`, {
      'data-key': key
    })
    panel.key = key
    panels.push(panel)
  }

  panel.parent = parent

  const isRoot = panel.key == 'root'

  if (!isRoot) {
    // back row
    const { $row } = createRow({ name: name!, type: 'back' as any })

    $row.addEventListener('click', () => {
      panel.$ref.classList.remove(activeCls)
      panel.parent?.$ref.classList.add(activeCls)
    })

    $.render($row, panel.$ref)
  }

  for (let i = 0; i < setting.length; i++) {
    const { name, type, key, children, icon, default: selected, onChange } = setting[i]!

    const { $row, $label } = createRow(
      Object.assign(
        {
          name,
          type,
          key: key,
          icon,
          default: selected
        },
        !isRoot && isSelectorOptionsPanel && { index: i }
      )
    )
    $.render($row, panel.$ref)
    $.render(panel.$ref, target)

    //处理 selector，因为依赖label，所以需先创建子 panel
    if (children) {
      const nextIsSelectorOptionsPanel =
        type == 'selector' && children.every((it) => !Boolean(it.type))

      const optionPanel = createPanel(player, panels, children, {
        key,
        target,
        parent: panel,
        isSelectorOptionsPanel: nextIsSelectorOptionsPanel,
        name: type == ('selector' as any) ? name : undefined
      })!

      $row.addEventListener('click', () => {
        panel.$ref.classList.remove(activeCls)
        optionPanel.$ref.classList.add(activeCls)
      })

      if (nextIsSelectorOptionsPanel) {
        const defaultSelected = children.find((it) => it.default)
        if (defaultSelected) {
          $label.innerText = defaultSelected.name
        }

        optionPanel.select = (i: number, shouldBeCallFn = true) => {
          if (i == -1) {
            optionPanel
              .$ref!.querySelector<HTMLDivElement>('[data-selected=true]')
              ?.setAttribute('data-selected', 'false')
            return
          }
          const $target = optionPanel.$ref.children[i + 1] as HTMLElement
          if ($target!.getAttribute('data-selected') != 'true') {
            $target!.setAttribute('data-selected', 'true')
            siblings($target, (sibling) => {
              if (sibling.hasAttribute('data-selected')) {
                sibling.setAttribute('data-selected', 'false')
              }
            })
            const value = children[i]
            $label.innerText = value!.name
            if (shouldBeCallFn) onChange?.(value, { index: i })
          }

          if (shouldBeCallFn) {
            panel.$ref.classList.add(activeCls)
            optionPanel.$ref.classList.remove(activeCls)
          }
        }

        optionPanel.$ref.addEventListener('click', (e) => {
          optionPanel.select!(+(e.target as HTMLDivElement).getAttribute('data-index')!)
        })
      }
    } else {
      if (type == 'switcher') {
        //@ts-ignore
        $row.select = function (shouldBeCallFn = true) {
          const selected = this.getAttribute('data-selected') == 'true'
          this.setAttribute('data-selected', `${!selected}`)
          if (shouldBeCallFn) onChange?.(!selected)
        }
        //@ts-ignore
        $row.addEventListener('click', () => $row.select())
      }
    }
  }

  return panel
}

export default function (player: Player, $el: HTMLElement, options: UiConfig['settings'] = []) {
  const $dom = $.create(`div.${setting}`, { 'aria-label': 'Setting' })
  let panels: Panel[] = []
  let $trigger: HTMLElement | null = null
  let isShow = false
  let hasRendered = false
  const defaultSettingMap = {
    loop: {
      name: player.locales.get('Loop'),
      type: 'switcher',
      key: 'loop',
      icon: Icons.get('loop'),
      default: player.isLoop,
      onChange: (value: boolean) => player.setLoop(value)
    }
  }

  bootstrap(options.map((it) => (typeof it == 'string' ? defaultSettingMap[it] : it)) as Setting[])

  function register(payload: Setting | Setting[]) {
    bootstrap(Array.isArray(payload) ? payload : [payload])
  }

  function unregister(key: string) {
    if (!hasRendered) return
    panels[0]?.$ref.querySelector(`[data-key=${key}]`)?.remove()
    panels = panels.filter((p) =>
      p.key === key ? (p.$ref.remove(), (p = null as any), false) : true
    )
  }

  function updateLabel(key: string, text: string) {
    console.log(key, text)

    if (!hasRendered) return
    const $item = $dom.querySelector<HTMLSpanElement>(`[data-key="${key}"] span[role="label"]`)
    if ($item) $item.innerText = text
  }

  function select(key: string, value: boolean | number, shouldBeCallFn: Boolean = true) {
    if (!hasRendered) return
    if (typeof value == 'number') {
      for (let i = 0; i < panels.length; i++) {
        const panel = panels[i]!
        if (panel.key == key) {
          panel.select!(value, shouldBeCallFn)
          break
        }
      }
    } else {
      $dom
        .querySelector<HTMLSpanElement & { select: Function }>(`[data-key="${key}"][data-selected]`)
        ?.select(shouldBeCallFn)
    }
  }

  function bootstrap(settings: Setting[]) {
    if (settings.length < 1) return

    if (!hasRendered) {
      hasRendered = true
      $.render($dom, $el)
      renderSettingMenu()

      function outClickListener(e: Event) {
        if (
          $trigger != e.target &&
          <HTMLElement>e.target != $dom &&
          !$dom.contains(<HTMLElement>e.target)
        ) {
          isShow = false
          player.$root.classList.remove(settingShown)
          panels.forEach(($p) => $p.$ref.classList.remove(activeCls))
        }
      }

      document.addEventListener('click', outClickListener)
      player.on('destroy', () => document.removeEventListener('click', outClickListener))
    }

    createPanel(player, panels, settings, { target: $dom })
  }

  function renderSettingMenu() {
    const parent = $el.querySelector<HTMLDivElement>(`.${controllerBottom}`)?.children[1]!
    const settingButton = $.create(
      'button',
      {
        class: `${icon} ${tooltip}`,
        'aria-label': player.locales.get('Setting')
      },
      `${Icons.get('setting')}`
    )

    parent!.insertBefore(settingButton, parent.children![parent.children.length - 2]!)
    settingButton.addEventListener('click', (e) => {
      $trigger = e.target as HTMLDivElement
      isShow = player.$root.classList.toggle(settingShown)
      if (isShow) {
        panels[0]!.$ref.classList.toggle(activeCls)
      } else {
        panels.forEach(($p) => $p.$ref.classList.remove(activeCls))
      }
    })
  }

  return { register, unregister, updateLabel, select }
}
