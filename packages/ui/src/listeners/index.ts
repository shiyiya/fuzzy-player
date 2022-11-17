import { isInitialized, initListener } from './init'
import { isPlaying, playingListener } from './playing'
import { isFocused, focusListener } from './focus'
import { isLoading, loadingListener } from './loading'
import fullscreenListener from './fullscreen'
import Player, { isMobile } from '@oplayer/core'
import { UiConfig } from '../types'

export {
  isInitialized,
  initListener,
  isPlaying,
  playingListener,
  isFocused,
  focusListener,
  isLoading,
  loadingListener,
  fullscreenListener
}

export default (player: Player, config: UiConfig, $root: HTMLDivElement) => {
  initListener(player)
  playingListener(player)
  loadingListener(player)
  fullscreenListener(player, $root)

  if (!isMobile) {
    focusListener(player, config.autoFocus)
  }
}
