import Hls from 'hls.js/dist/hls.light.min.js'
import type { ErrorData, HlsConfig } from 'hls.js'
import { PlayerPlugin, Source, Events } from '@oplayer/core'

const PLUGIN_NAME = 'oplayer-plugin-hls'

type hlsPluginOptions = {
  hlsConfig?: Partial<HlsConfig>
  matcher?: (video: HTMLVideoElement, source: Source) => boolean
}

const defaultMatcher: hlsPluginOptions['matcher'] = (video, source) =>
  !(
    Boolean(video.canPlayType('application/x-mpegURL')) ||
    Boolean(video.canPlayType('application/vnd.apple.mpegURL'))
  ) &&
  (source.format === 'm3u8' || /m3u8(#|\?|$)/i.test(source.src))

const hlsPlugin = ({
  hlsConfig = {},
  matcher = defaultMatcher
}: hlsPluginOptions = {}): PlayerPlugin => {
  let isInitial = false
  let hlsInstance: Hls | null = null

  const getHls = (options?: Partial<HlsConfig>): Hls => {
    if (hlsInstance) {
      hlsInstance.destroy()
    }
    hlsInstance = new Hls(options)
    return hlsInstance
  }

  return {
    name: PLUGIN_NAME,
    load: ({ on, emit }, video, source) => {
      if (!matcher(video, source)) return false

      hlsInstance = getHls({ autoStartLoad: false, ...hlsConfig })
      if (!isInitial) {
        emit(Events.pluginloaded, { name: PLUGIN_NAME })
        isInitial = true
      }

      if (!hlsInstance || !Hls.isSupported()) {
        emit(Events.pluginerror, {
          type: 'hlsNotSupported',
          message: 'hlsNotSupported'
        })
        return true
      }

      hlsInstance?.attachMedia(video)
      hlsInstance?.loadSource(source.src)
      hlsInstance?.startLoad()

      Object.values(Hls.Events).forEach((e) => {
        hlsInstance?.on(e as any, (event: string, data: ErrorData) => {
          if (
            event === Hls.Events.ERROR &&
            data.details == 'manifestLoadError' /*ErrorDetails.MANIFEST_LOAD_ERROR*/
          ) {
            emit(Events.pluginerror, { message: data.type, ...data })
          }
          emit(event as any, data)
        })
      })

      on(Events.destroy, () => {
        hlsInstance?.destroy()
        hlsInstance = null
      })

      return true
    }
  }
}

export default hlsPlugin
