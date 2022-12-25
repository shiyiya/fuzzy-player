import webtorrent from 'webtorrent/webtorrent.min.js'
import type { PlayerPlugin, Source } from '@oplayer/core'

let client: any
const PLUGIN_NAME = 'oplayer-plugin-torrent'

type torrentPluginOptions = {
  config?: Record<string, any>
  matcher?: (src: Source) => boolean
}

const defaultMatcher: torrentPluginOptions['matcher'] = (source) =>
  /magnet:?[^\"]+/.test(source.src) || /.*\.torrent/.test(source.src)

const torrentPlugin = ({
  config = {},
  matcher = defaultMatcher
}: torrentPluginOptions = {}): PlayerPlugin => {
  let prePreload: HTMLMediaElement['preload']

  return {
    name: PLUGIN_NAME,
    load: (player, source, options) => {
      const isMatch = matcher(source)
      const { $video } = player

      if (options.loader || !isMatch) {
        client?.remove(source.src)
        client?.destroy()
        $video.preload = prePreload
        player.loader = null
        return false
      }

      if (!webtorrent.WEBRTC_SUPPORT) return false

      prePreload = $video.preload
      client = new webtorrent(config)
      player.loader = client

      $video.preload = 'metadata'
      client.add(source.src, (torrent: any) => {
        const file = torrent.files.find((file: any) => file.name.endsWith('.mp4'))
        file.renderTo($video, { autoplay: $video.autoplay, controls: false })
      })

      return true
    },
    apply: ({ on }) => {
      on('destroy', () => {
        client?.destroy()
      })

      return webtorrent
    }
  }
}
export default torrentPlugin
