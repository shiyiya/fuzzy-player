import { EVENTS, PLAYER_EVENTS, VIDEO_EVENTS } from './constants'
import E from './event'
import I18n from './i18n'
import type {
  PlayerEvent,
  PlayerEventName,
  PlayerListener,
  PlayerOptions,
  PlayerPlugin,
  Source
} from './types'
import { isIOS, isQQBrowser } from './utils/platform'
import $ from './utils/dom'

export class Player {
  readonly container: HTMLElement
  readonly options: Required<PlayerOptions>

  readonly #E = new E()
  readonly locales: I18n
  readonly plugins: Set<PlayerPlugin> = new Set()

  $root: HTMLElement
  $video: HTMLVideoElement
  listeners: Record<typeof EVENTS[number], Function> = Object.create(null)

  hasError: boolean = false
  isCustomLoader: boolean = false

  evil: () => boolean

  //https://developer.chrome.com/blog/play-request-was-interrupted/
  #playPromise: Promise<void> | undefined

  constructor(el: HTMLElement, options: PlayerOptions | string) {
    this.container = el
    this.options = Object.assign(
      {
        autoplay: false,
        muted: false,
        loop: false,
        volume: 1,
        preload: 'metadata',
        playbackRate: 1,
        playsinline: true,
        lang: 'auto',
        source: {},
        videoAttr: {},
        evil: () => isQQBrowser // QQ浏览器会劫持 video
      },
      typeof options === 'string' ? { source: { src: options } } : options
    )

    this.evil = this.options.evil // QQ浏览器会劫持 video
    this.locales = new I18n(this.options.lang)
  }

  static make(el: HTMLElement, options: PlayerOptions | string): Player {
    return new Player(el, options)
  }

  readonly use = (plugins: PlayerPlugin | PlayerPlugin[]) => {
    ;[plugins].flat().forEach((plugin) => {
      this.plugins.add(plugin)
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
    if (this.options.source.src) this.load(this.options.source)
    return this
  }

  initEvent = () => {
    const errorHandler = (payload: ErrorEvent) => {
      this.hasError = true
      this.emit('error', payload)
    }
    this.listeners['error'] = errorHandler
    this.$video.addEventListener('error', (e) => this.listeners['error'](e))

    const fullscreenchangeHandler = (payload: ErrorEvent) => this.emit('fullscreenchange', payload)
    ;(
      [
        [this.$video, 'webkitbeginfullscreen', 'webkitendfullscreen'], //only iphone
        [this.$root, 'fullscreenchange', 'webkitfullscreenchange'] // others
      ] as const
    ).forEach((it) => {
      const [target, ...eventNames] = it
      // listener all.
      // `webkitfullscreenchange in Document` is false
      // TODO: check
      ;(eventNames as typeof EVENTS[number][]).forEach((eventName) => {
        this.listeners[eventName] = fullscreenchangeHandler
        target.addEventListener(eventName, (e) => this.listeners[eventName](e))
      })
    })

    const eventHandler = (eventName: string, payload: Event) => this.#E.emit(eventName, payload)
    VIDEO_EVENTS.filter((it) => it !== 'error').forEach((eventName) => {
      this.listeners[eventName] = eventHandler
      this.$video.addEventListener(eventName, (e) => this.listeners[eventName](eventName, e), {
        passive: true
      })
    })

    PLAYER_EVENTS.filter((it) => it !== 'fullscreenchange').forEach((eventName) => {
      this.listeners[eventName] = eventHandler
      this.$root.addEventListener(eventName, (e) => this.listeners[eventName](eventName, e), {
        passive: true
      })
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
        autoplay: this.options.autoplay,
        loop: this.options.loop,
        playsinline: this.options.playsinline,
        'webkit-playsinline': this.options.playsinline,
        'x5-playsinline': this.options.playsinline,
        preload: this.options.preload,
        poster: this.options.source.poster,
        ...this.options.videoAttr
      }
    )

    // not working `setAttribute`
    this.$video.muted = !!this.options.muted
    this.$video.volume = this.options.volume

    this.$root = $.create(
      `div.${$.css(`
        position: relative;
        -moz-user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        user-select: none;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background-color: #000;
      `)}`
    )

    $.render(this.$video, this.$root)
    $.render(this.$root, this.container)
  }

  load = async (source: Source) => {
    for await (const plugin of this.plugins) {
      if (plugin.load) {
        const match = await plugin.load(this, source, { loader: this.isCustomLoader })
        if (match && !this.isCustomLoader) this.isCustomLoader = true
      }
    }
    if (!this.isCustomLoader) {
      this.$video.src = source.src
    }
  }

  #applyPlugins = () => {
    this.plugins.forEach((plugin) => {
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
    return (this.#playPromise = this.$video.play())
  }

  pause() {
    if (this.#playPromise?.then) {
      return this.#playPromise.then(() => this.$video.pause())
    } else {
      return this.$video.pause()
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      return this.pause()
    } else {
      return this.play()
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
      return (this.$video as any).webkitEnterFullscreen()
    } else {
      return this.#requestFullscreen.call(this.$root, { navigationUI: 'hide' })
    }
  }

  exitFullscreen() {
    return this.#_exitFullscreen.call(document)
  }

  get isFullscreenEnabled() {
    return (
      Boolean(isIOS && (this.$video as any).webkitEnterFullscreen) ||
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    )
  }

  get isFullScreen() {
    return Boolean(
      (isIOS && (this.$video as any).webkitDisplayingFullscreen) ||
        (document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement) === this.$root
    )
  }

  toggleFullScreen() {
    if (this.isFullScreen) {
      return this.exitFullscreen()
    } else {
      return this.enterFullscreen()
    }
  }

  get isPipEnabled() {
    return document.pictureInPictureEnabled
  }

  enterPip() {
    return this.$video.requestPictureInPicture()
  }

  exitPip() {
    if (this.isInPip) {
      return document.exitPictureInPicture()
    }
    return false
  }

  get isInPip() {
    return document.pictureInPictureElement == this.$video
  }

  togglePip() {
    if (this.isInPip) {
      return this.exitPip()
    } else {
      return this.enterPip()
    }
  }

  async changeSource(source: Source) {
    this.#playPromise = undefined
    this.hasError = false
    this.isCustomLoader = false
    this.$video.poster = source.poster || ''
    await this.load(source)
    this.emit('videosourcechange', source)
  }

  destroy() {
    this.emit('destroy')
    this.pause()
    this.isFullScreen && this.exitFullscreen()
    this.plugins.clear()
    this.$video.src = ''
    this.$video.remove()
    this.container.remove()
    this.#E.offAll()
  }

  get state() {
    return this.$video.readyState
  }

  // Not working in IOS
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

  static get version() {
    return __VERSION__
  }
}
