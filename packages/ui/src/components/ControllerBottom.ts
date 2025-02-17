import { $, isIOS, isMobile } from '@oplayer/core'
import { Icons } from '../functions/icons'
import { controllerHidden, icon, off, on, tooltip } from '../style'
import { formatTime, screenShot } from '../utils'
import renderVolumeBar from './VolumeBar'
import renderProgress from './Progress'
import { isFullscreen, isWebFullscreen } from '../listeners/fullscreen'
import { isSupport as isSupportDocPip, togglePictureInPicture } from '../functions/doc-pip'

import type { UIInterface } from '../types'

import {
  controllers,
  dropdown,
  dropdownHoverable,
  expand,
  time,
  live,
  withIcon,
  centerProgressWrap
} from './ControllerBottom.style'
import { progress } from './Progress.style'

export const controllerBottomWrap = $.css({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  'z-index': 7,
  padding: '0 0.5em',
  transition: 'transform 0.3s ease, padding 0.3s ease',
  'min-height': 'var(--control-bar-height)',
  '&::before': {
    position: 'absolute',
    content: "''",
    width: '100%',
    display: 'block',
    bottom: 0,
    left: 0,
    'z-index': -1,
    top: '-1em',
    transition: 'opacity 0.3s ease',
    'pointer-events': 'none',
    'background-image': 'linear-gradient(transparent, rgba(0, 0, 0, .3))'
  },

  //TODO: support display-mode
  // '@media (display-mode: fullscreen)': {
  //   'padding-bottom': 'env(safe-area-inset-bottom)'
  // },

  [`@global .${controllerHidden} &`]: {
    'pointer-events': 'none',
    transform: 'translateY(calc(100% - 0.55em))',
    padding: 0,
    '&::before': { opacity: 0 }
  },

  [`@global .${controllerHidden} .${progress}`]: {
    'padding-left': 0,
    'padding-right': 0
  }
})

const render = (it: UIInterface, $el: HTMLDivElement) => {
  const { player, config } = it

  const el = $.render($.create(`div.${controllerBottomWrap}`), $el)

  if (!config.theme.progress?.mini || player.options.isLive) {
    $.css({
      [`@global .${controllerHidden} .${controllerBottomWrap}`]: {
        transform: 'translateY(100%)'
      }
    })
  }

  const [playLabel, pauseLabel, screenshotLabel, pipLabel, fullscreenLabel, previousLabel, nextLabel] = [
    player.locales.get('Play'),
    player.locales.get('Pause'),
    player.locales.get('Screenshot'),
    player.locales.get('Picture in Picture'),
    player.locales.get(player.isFullscreenEnabled ? 'Fullscreen' : 'WebFullscreen'),
    player.locales.get('Previous'),
    player.locales.get('Next')
  ]

  const [previousSvg, nextSvg] = [Icons.get('previous') || '', Icons.get('next') || '']
  const $dom = (it.$controllerBottom = $.create(
    `div.${controllers}`,
    {},
    `<div class="${withIcon}">

    ${
      previousSvg &&
      `<button class="${icon} ${tooltip}" aria-label="${previousLabel}" >${previousSvg}</button>`
    }

      <button
        class="${icon} ${player.isPlaying ? on : off} ${tooltip}"
        aria-label="${playLabel}"
      >
        ${Icons.get('play')}
        ${Icons.get('pause')}
      </button>

      ${nextSvg && `<button class="${icon} ${tooltip}" aria-label="${nextLabel}">${nextSvg}</button>`}

      ${player.options.isLive ? `<span class="${live}"></span>` : ''}

      <span class=${time}>${
        player.options.isLive || player.$video.preload == 'none' ? '00:00' : '00:00 / --:--'
      }</span>
    </div>

    <div class="${centerProgressWrap}"></div>

    <div class="${withIcon}">
      <div class="${dropdown} ${dropdownHoverable}">
        <button class="${icon} ${player.isMuted ? on : off}" aria-label="Volume">
            ${Icons.get('volume')[0]}
            ${Icons.get('volume')[1]}
        </button>
        ${!isIOS ? `<div class=${expand}></div>` : ''}
      </div>

      ${
        config.screenshot
          ? `<button class="${icon} ${tooltip}" aria-label="${screenshotLabel}">
              ${Icons.get('screenshot')}
            </button>`
          : ''
      }

      ${
        config.pictureInPicture && player.isPipEnabled
          ? `<button
              class="${icon} ${tooltip} ${player.isInPip ? on : off}"
              aria-label="${pipLabel}">
                ${Icons.get('pip')[0]}
                ${Icons.get('pip')[1]}
            </button>`
          : ''
      }

      ${
        config.fullscreen
          ? `<button class="${icon} ${off} ${tooltip}" aria-label="${fullscreenLabel}">
                ${Icons.get('fullscreen')[0]}
                ${Icons.get('fullscreen')[1]}
              </button>`
          : ''
      }
    </div>`
  ))

  if (
    (config.theme.progress?.position == 'auto' && isMobile) ||
    config.theme.progress?.position == 'center'
  ) {
    renderProgress(it, $dom.querySelector(`.${centerProgressWrap}`)!)
  } else {
    renderProgress(it, el)
  }

  const $volume = $dom.querySelector<HTMLButtonElement>('button[aria-label=Volume]')!
  // IOS只能使用物理按键控制音量大小
  if (!isIOS) renderVolumeBar(player, $volume.nextElementSibling! as HTMLDivElement)

  const $play = $dom.querySelector<HTMLButtonElement>(`button[aria-label=${playLabel}]`)!
  const $time = $dom.querySelector<HTMLSpanElement>('.' + time)!
  const $fullscreen = $dom.querySelector<HTMLButtonElement>(`button[aria-label="${fullscreenLabel}"]`)!
  const $pip = $dom.querySelector<HTMLButtonElement>(`button[aria-label="${pipLabel}"]`)!

  const switcher = (el: HTMLElement, display: boolean) => {
    el.classList.add(display ? on : off)
    el.classList.remove(display ? off : on)
  }

  if (config.fullscreen) {
    player.on('fullscreenchange', () =>
      setTimeout(() => {
        switcher($fullscreen, isFullscreen(player))
      })
    )
  }

  if (config.pictureInPicture) {
    player.on(['enterpictureinpicture', 'leavepictureinpicture'], () => switcher($pip, player.isInPip))
  }

  player.on(['play', 'pause', 'videosourcechange'], () => {
    $play.setAttribute('aria-label', player.isPlaying ? pauseLabel : playLabel)
    switcher($play, player.isPlaying)
  })

  player.on('volumechange', () => switcher($volume, player.isMuted))
  player.on(['durationchange', 'timeupdate', 'seeking', 'seeked'], () => {
    $time.innerText = `${formatTime(player.currentTime)} ${
      player.options.isLive ? '' : `/ ${formatTime(player.duration)}`
    }`
  })

  player.on('videosourcechange', () => {
    $time.innerText = player.options.isLive || player.$video.preload == 'none' ? '00:00' : '00:00 / --:--'
  })

  $dom.addEventListener('click', (e: Event) => {
    const target = e.target! as HTMLDivElement
    const label = target.getAttribute('aria-label')

    switch (label) {
      case playLabel:
      case pauseLabel:
        return player.togglePlay()
      case 'Volume':
        if (isMobile && !isIOS) return
        if (player.isMuted) {
          player.unmute()
        } else {
          player.mute()
        }
        break
      case pipLabel:
        if (isSupportDocPip()) {
          return togglePictureInPicture(player)
        }
        return player.togglePip()
      case fullscreenLabel:
        if (isWebFullscreen(player) || !player.isFullscreenEnabled) {
          player.emit('fullscreenchange', { isWeb: true })
        } else {
          player.toggleFullScreen()
        }
        return
      case screenshotLabel:
        screenShot(player)
        break
      case nextLabel:
        player.emit('next')
        break
      case previousLabel:
        player.emit('previous')
        break
      default:
        break
    }
  })

  $.render($dom, el)
}

export default render
