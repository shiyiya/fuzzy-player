import { $ } from '@oplayer/core'
import { icon, webFullScreen } from '../style'
import { formatTime, isMobile, screenShot, siblings, toggleClass } from '../utils'
import renderVolumeBar from './VolumeBar'

import type { Player } from '@oplayer/core'
import type { UiConfig } from '../types'

import expandSvg from '../icons/fullscreen-enter.svg?raw'
import compressSvg from '../icons/fullscreen-exit.svg?raw'
import pauseSvg from '../icons/pause.svg?raw'
import pipSvg from '../icons/pip.svg?raw'
import playSvg from '../icons/play.svg?raw'
import screenshotSvg from '../icons/screenshot.svg?raw'
import volumeOffSvg from '../icons/sound-off.svg?raw'
import volumeSvg from '../icons/sound-on.svg?raw'
import webExpandSvg from '../icons/webfullscreen-enter.svg?raw'
import webCompressSvg from '../icons/webfullscreen-exit.svg?raw'
import settingsSvg from '../icons/settings.svg?raw'

import {
  controllerBottom,
  dropdown,
  dropdownHoverable,
  dropitem,
  expand,
  time
} from './ControllerBottom.style'

const render = (player: Player, el: HTMLElement, config: UiConfig) => {
  const $dom = $.create(
    `div.${controllerBottom}`,
    {},
    `<div>
          ${
            !isMobile
              ? `<button
                  aria-label="Play"
                  class="${icon}"
                  type="button"
                >
                  ${playSvg}
                  ${pauseSvg}
                </button>`
              : ''
          }

          <span class=${time}>00:00 / --:--</span>
        </div>

        <div>
          <div class=${dropdownHoverable}>
            <button class=${icon} type="button">
              ${player.playbackRate == 1 ? 'SPD' : `${player.playbackRate}x`}
            </button>
            <div class=${expand}>
              ${config.speed
                ?.map(
                  (sp) =>
                    `<span
                      class=${dropitem}
                      aria-label="Speed"
                      data-value=${sp}
                      data-selected=${String(+sp == player.playbackRate)}
                    >
                      ${sp}<small>x</small>
                    </span>`
                )
                .join('')}
            </div>
          </div>

         ${
           config.screenshot
             ? `<button
                  aria-label="Screenshot"
                  class="${icon}"
                  type="button"
                >
                  ${screenshotSvg}
                </button>`
             : ''
         }

          <div class=${dropdownHoverable}>
            <button aria-label="Volume" class=${icon} type="button">
              ${volumeSvg}
              ${volumeOffSvg}
            </button>
            <div class=${expand}></div>
          </div>

          <div class=${dropdown}>
            <button aria-label="Setting" class=${icon} type="button">
              ${settingsSvg}
            </button>
            <div class=${expand}></div>
          </div>

          ${
            config.pictureInPicture && player.isPipEnabled
              ? `<button
                  aria-label="Picture in Picture"
                  class="${icon}"
                  type="button"
                >
                  ${pipSvg}
                </button>`
              : ''
          }

          ${
            config.fullscreen && player.isFullscreenEnabled
              ? `<div class=${dropdownHoverable}>
                  <button
                      aria-label="Fullscreen"
                      class="${icon}"
                      type="button"
                  >
                    ${expandSvg}
                    ${compressSvg}
                  </button>

                  ${
                    config.fullscreenWeb
                      ? `<div class=${expand}>
                          <button
                            aria-label="WebFullscreen"
                            class="${icon}"
                            type="button"
                          >
                          ${webExpandSvg}
                          ${webCompressSvg}
                          </button>
                        </div>`
                      : ''
                  }
                </div>`
              : config.fullscreenWeb
              ? `<button
                  aria-label="WebFullscreen"
                  class="${icon}"
                  type="button"
                >
                  ${webExpandSvg}
                  ${webCompressSvg}
                </button>`
              : ''
          }
        </div>`
  )

  renderVolumeBar(
    player,
    $dom.querySelector('button[aria-label="Volume"]')!.nextElementSibling! as HTMLDivElement
  )

  const $play = $dom.querySelector<HTMLButtonElement>('button[aria-label="Play"]')!
  const $volume = $dom.querySelector<HTMLButtonElement>('button[aria-label="Volume"]')!
  const $fullscreen = $dom.querySelector<HTMLButtonElement>('button[aria-label="Fullscreen"]')!
  const $webfull = $dom.querySelector<HTMLButtonElement>('button[aria-label="WebFullscreen"]')!

  const $time = $dom.querySelector<HTMLSpanElement>('.' + time)!

  const switcher = (el: HTMLCollection, key: 0 | 1) => {
    el[key]!.removeAttribute('style')
    ;(el.item(key == 1 ? 0 : 1) as HTMLDivElement).style.display = 'none'
  }

  const playerSwitcher = () => {
    !isMobile && switcher($play.children, player.isPlaying ? 1 : 0)
  }

  const volumeSwitcher = () => {
    switcher($volume.children, player.isMuted || player.volume == 0 ? 1 : 0)
  }

  const fullscreenSwitcher = () => {
    switcher($fullscreen.children, player.isFullScreen ? 1 : 0)
  }

  const webfullscreenSwitcher = (isWebfullScreen: boolean) => {
    switcher($webfull.children, isWebfullScreen ? 1 : 0)
  }

  playerSwitcher(), volumeSwitcher()

  if (player.isFullscreenEnabled && config.fullscreen) {
    fullscreenSwitcher()
    player.on('fullscreenchange', () => setTimeout(fullscreenSwitcher))
  }

  if (config.fullscreenWeb) {
    webfullscreenSwitcher(false)
    player.on('webfullscreen', () =>
      webfullscreenSwitcher(toggleClass(player.$root, webFullScreen))
    )
  }

  !isMobile && player.on(['play', 'pause', 'videosourcechange'], playerSwitcher)
  player.on('volumechange', volumeSwitcher)
  player.on(['durationchange', 'timeupdate', 'videosourcechange'], () => {
    $time.innerText = `${formatTime(player.currentTime)} / ${formatTime(player.duration)}`
  })

  let preVolumn = player.volume

  $dom.addEventListener('click', (e: Event) => {
    const target = e.target! as HTMLDivElement
    const label = target.getAttribute('aria-label')

    switch (label) {
      case 'Play':
        return player.togglePlay()
      case 'Speed': {
        const speed = target.getAttribute('data-value')!
        target.setAttribute('data-selected', 'true')
        siblings(target, (t) => t.setAttribute('data-selected', 'false'))
        target.parentElement!.previousElementSibling!.textContent = speed + 'x'
        player.setPlaybackRate(+speed)
        break
      }
      case 'Volume':
        if (player.isMuted) {
          player.unmute()
          player.setVolume(preVolumn)
        } else {
          preVolumn = player.volume
          player.mute()
        }
        break
      case 'Picture in Picture':
        return player.togglePip()
      case 'Fullscreen':
        return player.toggleFullScreen()
      case 'WebFullscreen':
        player.emit('webfullscreen')
        break
      case 'Screenshot':
        screenShot(player)
        break
      case 'Setting': {
        player.emit('settingvisibilitychange', e)
        break
      }
      default:
        break
    }
  })

  $.render($dom, el)
}

export default render
