export { $ } from './utils/dom'
export { isIOS } from './utils/index'

export { EVENTS, VIDEO_EVENTS, PLAYER_EVENTS, OH_EVENTS } from './constants'

export { Player } from './player'
export { Player as default } from './player'

export type {
  Source,
  PlayerOptions,
  PlayerEventName,
  PlayerEvent,
  PlayerListener,
  PlayerPlugin
} from './types'
