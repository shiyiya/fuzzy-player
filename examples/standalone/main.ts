import Player, { PlayerEvent, PlayerPlugin } from '@oplayer/core'
import danmaku, { DanmakuItem } from '@oplayer/danmaku'
import hls from '@oplayer/hls'
import ui from '@oplayer/ui'
import { isMobile } from '@oplayer/ui/src/utils'
import flvjs from 'flv.js'

import { html, render } from 'lit'
import { live } from 'lit/directives/live.js'
import { ref } from 'lit/directives/ref.js'

const dataSrcs = [
  'https://oplayer.vercel.app/君の名は.mp4',
  'https://test-streams.mux.dev/x36xhzz/url_0/193039199_mp4_h264_aac_hd_7.m3u8',
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://ukzyvod3.ukubf5.com/20220410/yAU8vUFg/2000kb/hls/index.m3u8'
] as const

const querySrc = new URLSearchParams(window.location.search).get('src')
let src = querySrc || dataSrcs[0]
let currentDataSrcId = querySrc ? -1 : 0

const quailitySrcs = [
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://media.w3.org/2010/05/sintel/trailer_hd.mp4'
] as const

const flvPlugin: PlayerPlugin = {
  name: 'oplayer-flv-plugin',
  load: (_, video, source) => {
    if (source.format != 'flv' || /\.flv(#|\?|$)/i.test(source.src)) return false
    const flvPlayer = flvjs.createPlayer({
      type: 'flv',
      url: source.src
    })
    flvPlayer.attachMediaElement(video)
    flvPlayer.load()
    return true
  }
}

let logs: HTMLTextAreaElement

const p = Player.make(document.getElementById('player')!, {
  muted: true,
  volume: 0.5,
  source: { src }
  // screenshot
  // videoAttr: {
  //   crossorigin: 'anonymous'
  // }
})
  .use([
    hls(),
    flvPlugin,
    danmaku({
      source: 'https://oplayer.vercel.app/danmaku.xml',
      fontSize: isMobile ? 16 : 20,
      filter: (d: DanmakuItem) => d.text == '+1s'
    }),
    ui({
      autoFocus: true,
      theme: { primaryColor: '#f00' },
      speed: ['0.5', '1.0', '2.0', '10.0'].reverse(),
      subtitle: [
        {
          name: 'JP & ZH',
          default: true,
          url: 'https://oplayer.vercel.app/君の名は.srt'
        }
      ],
      thumbnails: { url: 'https://oplayer.vercel.app/thumbnails.jpg', number: 100 }
    })
  ])
  .create()

const meta = () => html`
  <div>
    <h4>Oh-Player v${Player.version}</h4>
    <p>
      STAR ON <a target="_blank" href="https://github.com/shiyiya/oplayer">GitHub</a> |
      <a href="./umd.html" target="_blank">UMD DEMO</a>
    </p>
  </div>
`

const actions = () => html`<p style="display:flex;">
    <input
      type="text"
      @input=${(e: any) => (src = e.target.value)}
      style="width:100%;"
      .value=${live(src)}
    />

    <button @click=${() => p.changeSource({ src })}>Load</button>

    <button
      @click=${() => {
        src =
          dataSrcs[
            currentDataSrcId + 1 >= dataSrcs.length
              ? (currentDataSrcId = 0)
              : (currentDataSrcId += 1)
          ]!
        p.changeSource({ src })
      }}
    >
      Queue
    </button>
  </p>

  <textarea readonly ${ref((f) => (logs = f as any))}></textarea> `

render(actions(), document.getElementById('actions')!)

p.on((e: PlayerEvent) => {
  if (e.type == 'mousemove') return

  render(actions(), document.getElementById('actions')!)

  let eventName = `==> ${e.type}`
  if ('durationchange' == e.type) {
    eventName += `: ${p.duration}`
  }

  logs.value = eventName + '\r\n' + logs.value
  // logs.style.height = `${logs.scrollHeight}px`

  if (e.type == 'videosourcechange') {
    logs.value = ''
  }

  if (logs.value.split('==>').length >= 66) {
    logs.value =
      '==> ------------clear logs------------- \r\n' +
      logs.value.split('==>').slice(0, 20).join('==>')
  }

  // console.info(e)
})

// p.$root.addEventListener('click', p.unmute.bind(p), { once: true })

render(meta(), document.getElementById('meta')!)
