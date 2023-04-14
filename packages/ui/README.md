# OPlayer UI

[![npm](https://img.shields.io/npm/v/@oplayer/ui?style=flat-square&label=@oplayer/ui)](https://www.npmjs.com/package/@oplayer/ui)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/@oplayer/ui?style=flat-square)
[![npm dm](https://img.shields.io/npm/dm/@oplayer/ui?style=flat-square)](https://www.npmjs.com/package/@oplayer/ui)
[![jsdelivr](https://data.jsdelivr.com/v1/package/npm/@oplayer/ui/badge)](https://www.jsdelivr.com/package/npm/@oplayer/ui)

![oplayer-mobile](https://github.com/shiyiya/oplayer/raw/main/packages/ui/oplayer-ui-mobile.png)

## Install

```bash
npm i @oplayer/core @oplayer/ui
```

```html
<script src="https://cdn.jsdelivr.net/npm/@oplayer/core@latest/dist/index.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@oplayer/ui@latest/dist/index.core.js"></script>

<!-- core + ui -->
<script src="https://cdn.jsdelivr.net/npm/@oplayer/core@latest/dist/index.ui.js"></script>
<script>
  var OUI = OPlayer.ui
</script>
```

## Basic

```js
const player = Player.make('#player', {
  source: {
    title: '君の名は',
    src: 'https://oplayer.vercel.app/君の名は.mp4',
    poster: 'https://oplayer.vercel.app/poster.png'
  }
})
  .use([OUI()])
  .create()
```

## Full-Options (default value)

```js
OUI({
  theme: { primaryColor: '#f00' },
  keyboard: { focused: true, global: false },
  speed: ['2.0', '1.75', '1.25', '1.0', '0.75', '0.5'],
  autoFocus: false,
  screenshot: false,
  fullscreen: true,
  pictureInPicture: false,
  miniProgressBar: true,
  coverButton: true,
  speed: ['2.0', '1.75', '1.25', '1.0', '0.75', '0.5'],
  settings: ['loop'],
  showControls: 'always', // 'played'
  slideToSeek: 'none', // 'always' | 'long-touch'
  forceLandscapeOnFullscreen: true,
  controlBar: false, // | { back:  'always' | 'fullscreen' } // appbar
  topSetting: false, //show setting icon on appbar
  subtitle: {
    color: 'hotpink',
    fontSize: 20,
    fontFamily: '',
    source: [
      {
        name: 'Japanese',
        default: true,
        src: 'https://oplayer.vercel.app/君の名は.srt'
      },
      {
        name: 'English',
        default: false,
        src: 'https://oplayer.vercel.app/君の名は.srt'
      }
    ]
  },
  thumbnails: {
    isVTT: false, //vtt thumbnails
    width: 160,
    height: 90,
    number: 100,
    src: 'https://oplayer.vercel.app/thumbnails.jpg'
  },
  highlight: [
    { time: 12, text: '谁でもいいはずなのに' },
    { time: 34, text: '夏の想い出がまわる' },
    { time: 58, text: 'こんなとこにあるはずもないのに' },
    { time: 88, text: '－－终わり－－' }
  ],
  icons: {
    play: '',
    pause: '',
    volume: ['', ''], //on off
    fullscreen: ['', ''], //on off
    pip: '',
    setting: '',
    screenshot: '',
    playbackRate: '',
    loop: '',
    progressIndicator: '',
    loadingIndicator: ''
  },
  menu: [
    {
      name: 'Quality(清晰度)',
      key: 'Quality', // for select Optional
      position: 'bottom', // or top
      children: [
        {
          name: 'FHD',
          default: true,
          value: 'https://oplayer.vercel.app/君の名は.mp4'
        },
        {
          name: 'HD',
          value: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
        },
        {
          name: 'SD',
          value: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd'
        }
      ],
      onChange({ value }) {
        player.changeQuality({ src: value })
      }
    }
  ]
})
```

## Methods

All methods on `player.context.ui`

```js
// - Update subtitle
player.context.ui.subtitle.updateSource([])

// - Update highlight
player.context.ui.highlight([])

// - Update thumbnails
player.context.ui.thumbnails('src')

// - Register menu
player.context.ui.menu.register({})
player.context.ui.menu.unregister('key')
player.context.ui.menu.select('key', 'index')

// - Display error
player.context.ui.menu.error({ message: 'msg', code: 'number' })
```

## keyboard

- ↑ volume +10%
- ↓ volume -10%
- ← seek -5s
- → seek +5s
- `space` play or pause
- `s` catch a screenshot
- `f` toggle full-screen

## Gesture

## Events
