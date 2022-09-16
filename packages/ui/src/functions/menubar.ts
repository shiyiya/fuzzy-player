import Player, { $, PlayerEvent } from '@oplayer/core'
import { icon as iconCls } from '../style'
import { dropdown, dropdownHoverable, expand, dropItem } from '../components/ControllerBottom.style'
import type { MenuBar } from '../types'
import { siblings } from '../utils'

const select = (elm: HTMLElement) => {
  const selected = elm.getAttribute('data-selected') == 'true'
  elm.setAttribute('data-selected', `${!selected}`)
  siblings(elm, (it) => it.setAttribute('data-selected', `${selected}`))
}

export default (player: Player, initialState?: MenuBar[]) => {
  let $bar: HTMLDivElement
  const menus: MenuBar[] = []
  let queue: MenuBar[] = []

  if (initialState) queue.push(...initialState)
  player.on('menubar:loaded', ({ payload }) => {
    $bar = payload

    $bar.addEventListener('click', (e) => {
      const elm: HTMLElement = e.target as HTMLElement
      const label = elm.getAttribute('aria-label')
      const target = menus.find((it) => it.name == label)

      if (elm.tagName == 'div') {
        target?.onClick?.()
      } else {
        select(elm)
        target?.onChange?.(target.children[+elm.getAttribute('data-selected')!]!)
      }
    })

    queue.forEach((it) => create(it))
  })

  player.on('menubar:register', ({ payload }) => {
    if (!$bar) {
      queue.push(payload)
    } else {
      create(payload)
    }
  })

  player.on('menubar:unregister', ({ payload }) => {
    $bar.querySelector(`[aria-label=${payload.name}]`)?.remove()
  })

  player.on('menubar:select', ({ payload }: PlayerEvent<{ name: string; index: number }>) => {
    select(
      $bar.querySelector(`div > [aria-label=${payload.name}] span:nth-child(${payload.index})`)!
    )
  })

  const create = (menu: MenuBar) => {
    const { name, icon, children } = menu
    let $menu: string = ''
    const $button = `
    <button aria-label="${name}" class="${iconCls} ${
      !icon ? $.css('width:auto!important;margin:0 8px;') : ''
    }" type="button">
      ${icon || name}
    </button>`

    if (menu.children) {
      $menu = `
      <div class="${dropdown} ${dropdownHoverable}" aria-label="${name}">
        ${$button}
        <div class=${expand}>
          ${children
            .map(
              (it, i) =>
                `<span  class=${dropItem} data-selected=${Boolean(it.default)} data-index=${i}>
                  ${it.name}
                </span>`
            )
            .join('')}
          </div>
      </div>
      `
    } else {
      $menu = $button
    }

    menus.push(menu)
    $bar.insertAdjacentHTML('afterbegin', $menu)
  }
}
