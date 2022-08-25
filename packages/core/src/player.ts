import { PLAYER_EVENTS, VIDEO_EVENTS } from './constants'
import E from './event'
import type {
  PlayerEvent,
  PlayerEventName,
  PlayerListener,
  PlayerOptions,
  PlayerPlugin,
  Source
} from './types'
import { isIOS } from './utils'
import $ from './utils/dom'

export class Player {
  constructor(el: HTMLElement, options: PlayerOptions | string) {
    this.#container = el
    this.#options = Object.assign(
      {
        autoplay: false,
        muted: false,
        loop: false,
        volume: 1,
        preload: 'auto',
        poster: '',
        playbackRate: 1,
        playsinline: true,
        videoAttr: {}
      },
      typeof options === 'string' ? { source: { src: options } } : options
    )
  }

  readonly #options: PlayerOptions
  readonly #container: HTMLElement

  readonly #E = new E()
  readonly #plugins: Set<PlayerPlugin> = new Set()

  $root: HTMLElement
  $video: HTMLVideoElement
  #isCustomLoader: boolean

  hasError: boolean = false

  //https://developer.chrome.com/blog/play-request-was-interrupted/
  #playPromise: Promise<void> | undefined

  static make(el: HTMLElement, options: PlayerOptions | string): Player {
    return new Player(el, options)
  }

  readonly use = (plugins: PlayerPlugin | PlayerPlugin[]) => {
    ;[plugins].flat().forEach((plugin) => {
      this.#plugins.add(plugin)
    })
    return this
  }

  readonly on = (
    name: PlayerEventName | PlayerListener,
    listener?: PlayerListener,
    options = { once: false }
  ) => {
    if (typeof name === 'string') {
      if (options.once) {
        this.#E.once(name, listener!)
      } else {
        this.#E.on(name, listener!)
      }
    } else if (Array.isArray(name)) {
      this.#E.onAny(name as string[], listener!)
    } else if (typeof name === 'function') {
      this.#E.on('*', name!)
    }
    return this
  }

  readonly off = (name: PlayerEventName, listener: PlayerListener) => {
    this.#E.off(name as string, listener)
  }

  readonly offAny = (name: PlayerEventName) => {
    this.#E.offAny(name as string)
  }

  readonly emit = (name: PlayerEventName, payload?: PlayerEvent['payload']) => {
    this.#E.emit(name as any, payload)
  }

  readonly create = () => {
    this.render()
    this.initEvent()
    this.#applyPlugins()
    if (this.#options.source.src) this.load(this.#options.source)
    return this
  }

  initEvent = () => {
    this.on('error', () => {
      this.hasError = true
    })
    VIDEO_EVENTS.forEach((event) => {
      this.$video.addEventListener(
        event,
        (e) => {
          this.#E.emit(event, e)
        },
        { passive: true }
      )
    })
    PLAYER_EVENTS.forEach((event) => {
      this.$root.addEventListener(
        event,
        (e) => {
          this.#E.emit(event, e)
        },
        { passive: true }
      )
    })
  }

  readonly render = () => {
    this.$video = $.create(
      `video.${$.css(`
        width: 100%;
        height: 100%;
        display: block;
        position: relative;
      `)}`,
      {
        autoplay: this.#options.autoplay,
        loop: this.#options.loop,
        playsinline: this.#options.playsinline,
        'webkit-playsinline': this.#options.playsinline,
        'x5-playsinline': this.#options.playsinline,
        volume: this.#options.volume,
        preload: this.#options.preload,
        poster: this.#options.source.poster,
        ...this.#options.videoAttr
      }
    )

    this.$root = $.create(
      `div.${$.css(`
        position: relative;
        user-select: none;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background-color: #000;
      `)}`
    )

    this.$video.muted = !!this.#options.muted
    $.render(this.$video, this.$root)
    $.render(this.$root, this.container)
  }

  load = (source: Source) => {
    this.#plugins.forEach((plugin) => {
      if (plugin.load && !this.#isCustomLoader) {
        this.#isCustomLoader = plugin.load(this, this.$video, source)
      }
    })
    if (!this.#isCustomLoader) {
      this.$video.src = source.src
    }
  }

  #applyPlugins = () => {
    this.#plugins.forEach((plugin) => {
      if (plugin.apply) {
        plugin.apply(this)
      }
    })
  }

  setPoster(poster: string) {
    this.$video.poster = poster
  }

  play = () => {
    if (!this.$video.src) throw Error('The element has no supported sources.')

    if (this.#isCustomLoader || this.canPlay) {
      this.#playPromise = this.$video
        .play()
        .catch((reason) => this.emit('notice', { text: (<Error>reason).message }))
    }
  }

  pause() {
    if (this.#playPromise?.then) {
      this.#playPromise.then(() => this.$video.pause())
    } else {
      this.$video.pause()
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  mute() {
    this.$video.muted = true
  }

  unmute() {
    this.$video.muted = false
  }

  toggleMute() {
    if (this.isMuted) {
      this.unmute()
    } else {
      this.mute()
    }
  }
  setVolume(volume: number) {
    this.$video.volume = volume > 1 ? 1 : volume < 0 ? 0 : volume
    if (this.$video.volume > 0 && this.isMuted) {
      this.unmute()
    }
  }

  setPlaybackRate(rate: number) {
    this.$video.playbackRate = rate
  }

  seek(time: number) {
    this.$video.currentTime = time
  }

  setLoop(loop: boolean) {
    this.$video.loop = loop
  }

  enterFullscreen() {
    if (isIOS) {
      ;(this.$root as any).webkitEnterFullscreen()
    } else {
      this.#requestFullscreen.call(this.$root, { navigationUI: 'hide' })
    }
    this.emit('fullscreenchange')
  }

  exitFullscreen() {
    this.#_exitFullscreen.call(document)
    this.emit('fullscreenchange')
  }

  get isFullscreenEnabled() {
    return (
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    )
  }

  get isFullScreen() {
    return (
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement === this.$root
    )
  }

  toggleFullScreen() {
    if (this.isFullScreen) {
      this.exitFullscreen()
    } else {
      this.enterFullscreen()
    }
  }

  get isPipEnabled() {
    return document.pictureInPictureEnabled
  }

  enterPip() {
    this.$video.requestPictureInPicture()
  }

  exitPip() {
    if (this.isInPip) {
      document.exitPictureInPicture()
    }
  }

  get isInPip() {
    return document.pictureInPictureElement == this.$video
  }

  togglePip() {
    if (this.isInPip) {
      document.exitPictureInPicture()
    } else {
      this.$video.requestPictureInPicture()
    }
  }

  changeSource(sources: Source) {
    this.#playPromise = undefined
    this.hasError = false
    this.#isCustomLoader = false
    this.$video.poster = sources.poster || ''
    this.load(sources)
    this.emit('videosourcechange')
  }

  destroy() {
    this.emit('destroy')
    this.pause()
    this.isFullScreen && this.exitFullscreen()
    this.#plugins.clear()
    this.$video.src = ''
    this.$video.remove()
    this.#container.remove()
    this.#E.offAll()
  }

  get container() {
    return this.#container
  }

  get state() {
    return this.$video.readyState
  }

  get isLoading() {
    /**
     * @HAVE_FUTURE_DATA canplay: fired when video ready to play but buffering not complete
     * @HAVE_ENOUGH_DATA canplaythrough : fired when video ready to play and buffering complete
     */
    return this.$video.readyState < this.$video.HAVE_ENOUGH_DATA && !this.hasError
  }

  get isLoaded() {
    return this.$video.readyState >= this.$video.HAVE_FUTURE_DATA // 3
  }

  get canPlay() {
    return this.$video.readyState >= this.$video.HAVE_ENOUGH_DATA // 4
  }

  get isPlaying() {
    return this.$video.paused === false
  }

  get isMuted() {
    return this.$video.muted
  }

  get isEnded() {
    return this.$video.ended
  }

  get isLoop() {
    return this.$video.loop
  }

  get isAutoPlay() {
    return this.$video.autoplay
  }

  get duration() {
    return this.$video.duration
  }

  get buffered() {
    return this.$video.buffered
  }

  get currentTime() {
    return this.$video.currentTime
  }

  get volume() {
    return this.$video.volume
  }

  get playbackRate() {
    return this.$video.playbackRate
  }

  get #requestFullscreen(): Element['requestFullscreen'] {
    return (
      HTMLElement.prototype.requestFullscreen ||
      (HTMLElement.prototype as any).webkitRequestFullscreen ||
      (HTMLElement.prototype as any).mozRequestFullScreen ||
      (HTMLElement.prototype as any).msRequestFullscreen
    )
  }

  get #_exitFullscreen(): Document['exitFullscreen'] {
    return (
      Document.prototype.exitFullscreen ||
      (Document.prototype as any).webkitExitFullscreen ||
      (Document.prototype as any).cancelFullScreen ||
      (Document.prototype as any).mozCancelFullScreen ||
      (Document.prototype as any).msExitFullscreen
    )
  }

  get plugins() {
    return [...this.#plugins].map((plugin) => plugin.name || 'anonymous')
  }

  static get version() {
    return __VERSION__
  }
}
