# OPlayer

Oh! Another HTML5 video player.

Website: https://oplayer.vercel.app | https://shiyiya.github.io/oplayer

Examples: [./examples](./examples) | [Contributing](./CONTRIBUTING.md)

Discussions: [Discord](https://discord.gg/hzjxYyPbKh) | [GitHub Discussions](https://github.com/shiyiya/oplayer/discussions) | [QQGroup](https://jq.qq.com/?_wv=1027&k=YzsRgkXB)

[![npm](https://img.shields.io/npm/v/@oplayer/core?style=flat-square&color=fb3e44)](https://www.npmjs.com/package/@oplayer/core)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/@oplayer/core?style=flat-square&label=core)
![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@oplayer/ui?style=flat-square&label=ui)
![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@oplayer/react?style=flat-square&label=react)
![npm dw](https://img.shields.io/npm/dw/@oplayer/core?style=flat-square)
[![donate](https://img.shields.io/badge/$-donate-ff69b4.svg?style=flat-square)](https://paypal.me/ShiYiYa)

![oplayer](./oplayer.png)

## Feature

- Streaming formats
  - HLS
  - MPEG DASH
  - WebTorrent
  - FLV
  - Any other custom streaming formats
- Media formats
  - MP4 H.264
  - WebM
  - Ogg Theora Vorbis
- Features
  - Danmaku
  - Screenshot
  - Hotkeys
  - Thumbnails
  - Subtitle

## Usage

```bash
pnpm i @oplayer/core @oplayer/ui @oplayer/danmaku
# or
yarn add @oplayer/core @oplayer/ui @oplayer/danmaku
```

```ts
import Player from '@oplayer/core'
import ui from '@oplayer/ui'
import danmaku from '@oplayer/danmaku'

Player.make(document.body, {
  source: {
    src: 'https://oplayer.vercel.app/君の名は.mp4',
    poster: 'https://oplayer.vercel.app/poster.png'
  }
})
  .use([
    danmaku({ source: 'https://oplayer.vercel.app/danmaku.xml' }),
    ui({
      theme: { primaryColor: '#f00' },
      subtitle: {
        source: [
          {
            name: 'Default',
            default: true,
            src: 'https://oplayer.vercel.app/君の名は.srt'
          }
        ]
      },
      thumbnails: { src: 'https://oplayer.vercel.app/thumbnails.jpg', number: 100 },
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
      ]
    })
  ])
  .create()
```

## Official plugin

- [@oplayer/ui](./packages//ui/)
- [@oplayer/hls](./packages/hls/)
- [@oplayer/dash](./packages/dash/)
- [@oplayer/torrent](./packages/torrent/)
- [@oplayer/danmaku](./packages/danmaku/)
- [@oplayer/react](./packages/react/)

## Who use OPlayer?

- [UPV](https://月色真美.life) : free animes no ad
- ...

## Thanks

- [Boy\_\_Yan](https://www.iconfont.cn/collections/detail?cid=40262)
- [1214monkey](https://www.iconfont.cn/collections/detail?spm=a313x.7781069.0.da5a778a4&cid=12086)
- [loop](https://www.iconfont.cn/collections/detail?spm=a313x.7781069.0.da5a778a4&cid=15901)
- [quality](https://www.iconfont.cn/collections/detail?spm=a313x.7781069.0.da5a778a4&cid=13520)
- [speed](https://www.iconfont.cn/collections/detail?spm=a313x.7781069.0.da5a778a4&cid=39216)

- https://developer.mozilla.org/zh-CN/docs/Web/CSS/::backdrop
