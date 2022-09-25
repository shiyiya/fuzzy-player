//@ts-nocheck
import Player, { PlayerEvent, isMobile, isIOS, isiPad, isiPhone } from '@oplayer/core'
import danmaku, { DanmakuItem } from '@oplayer/danmaku'
import ui from '@oplayer/ui'
import hls from '@oplayer/hls'
import dash from '@oplayer/dash'

import MP4 from '../../website/static/君の名は.mp4'
import SRT from '../../website/static/君の名は.srt'
import DANMAKU from '../../website/static/danmaku.xml'
import THUMB from '../../website/static/thumbnails.jpg'
import POSTER from '../../website/static/poster.png'

import { html, render } from 'lit'
import { live } from 'lit/directives/live.js'
import { ref } from 'lit/directives/ref.js'
import { played } from '@oplayer/ui/src/components/Progress.style'

const dataSrcs = [
  'https://cdn6.hnzycdn.com:65/20220712/O5XeHGZz/1935kb/hls/index.m3u8',
  'https://cdn6.hnzycdn.com:65/20220712/xb2EScnz/1672kb/hls/index.m3u8',
  MP4,
  'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
  'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  'https://test-streams.mux.dev/x36xhzz/url_0/193039199_mp4_h264_aac_hd_7.m3u8',
  'https://ukzyvod3.ukubf5.com/20220410/yAU8vUFg/2000kb/hls/index.m3u8',
  'https://media.w3.org/2010/05/sintel/trailer.mp4'
] as const

const querySrc = new URLSearchParams(window.location.search).get('src')
let src = querySrc || dataSrcs[0]
let currentDataSrcId = querySrc ? -1 : 0

const quailitySrcs = [
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://media.w3.org/2010/05/sintel/trailer_hd.mp4'
] as const

let logs: HTMLTextAreaElement

const p = Player.make(document.getElementById('player')!, {
  muted: true,
  volume: 0.5,
  source: { src, poster: POSTER },
  // screenshot
  videoAttr: {
    crossorigin: 'anonymous'
  }
})
  .use([
    ui({
      autoFocus: true,
      screenshot: true,
      theme: { primaryColor: '#f00' },
      subtitle: {
        color: 'hotpink',
        fontSize: isMobile ? 16 : 20,
        source: []
      },
      thumbnails: {
        src:
          'https://preview.zorores.com/4b/4b1a02c7ffcad4f1ee11cd6f474548cb/thumbnails/sprite.vtt' ||
          THUMB,
        base: 'https://preview.zorores.com/4b/4b1a02c7ffcad4f1ee11cd6f474548cb/thumbnails/',
        isVTT: true,
        number: 100
      },
      highlight: [
        {
          time: 12,
          text: '谁でもいいはずなのに'
        },
        {
          time: 34,
          text: '夏の想い出がまわる'
        },
        {
          time: 58,
          text: 'こんなとこにあるはずもないのに'
        },
        {
          time: 88,
          text: '－－终わり－－'
        }
      ],
      menu: [
        {
          name: '剧集',
          children: [
            {
              name: '第一集',
              default: true
            },
            {
              name: '第二集'
            },
            {
              name: '第三集'
            }
          ],
          onChange(...arg) {
            console.log(arg)
          }
        }
      ]
    }),
    dash(),
    hls({
      options: {
        hlsQualityControl: true,
        hlsQualitySwitch: 'immediate'
      }
    })
    // danmaku({
    //   source: DANMAKU,
    //   opacity: 0.8,
    //   filter: (d: DanmakuItem) => d.text == '+1s'
    // })
  ])
  .create()

p.changeSubtitleSource([
  {
    name: 'Default',
    default: true,
    src: 'https://cc.zorores.com/7f/c1/7fc1657015c5ae073e9db2e51ad0f8a0/eng-2.vtt'
  }
])

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

window.p = p

console.table({
  UA: globalThis.navigator?.userAgent,
  isMobile,
  isIOS,
  isiPad,
  isiPhone,
  fullscreenEnabled: Boolean(document.fullscreenEnabled),
  webkitFullscreenEnabled: Boolean(document.webkitFullscreenEnabled),
  mozFullScreenEnabled: Boolean(document.mozFullScreenEnabled),
  msFullscreenEnabled: Boolean(document.msFullscreenEnabled),
  video: Boolean(p.$video.webkitEnterFullscreen)
})
