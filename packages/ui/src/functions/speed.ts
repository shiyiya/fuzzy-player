import type { Player } from '@oplayer/core'
import { Setting, UiConfig } from '../types'
import { Icons } from './icons'

const KEY = 'speed'

export default function registerSpeedSetting(
  player: Player,
  speeds: UiConfig['speed'],
  setting: any
) {
  if (speeds?.length) {
    setting.register(<Setting>{
      key: KEY,
      type: 'selector',
      name: player.locales.get('Speed'),
      icon: Icons.get('playbackRate'),
      children: speeds.map((speed) => ({
        name: +speed == 1 ? 'Normal' : speed + 'x',
        value: +speed,
        default: player.playbackRate == +speed
      })),
      onChange: ({ value }) => player.setPlaybackRate(value)
    })

    player.on('ratechange', () => {
      const rate = player.playbackRate
      const i = speeds.findIndex((it) => +it == rate)
      setting.select(KEY, i)
      if (i == -1) {
        setting.updateLabel(KEY, rate + 'x')
      }
    })
  }
}
