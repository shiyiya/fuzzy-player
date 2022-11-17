import { $, isMobile } from '@oplayer/core'
import { thumbnailCls } from './thumbnail'
import { vttThumbnailsCls } from './vtt-thumbnails'

export const buffered = $.css({
  'background-color': 'hsla(0, 0%, 100%, 0.4)'
})

export const played = $.css({
  'background-color': 'var(--primary-color)'
})

export const dot = $.css({
  width: '100%',
  'pointer-events': 'none',
  position: 'relative',
  'z-index': 1,

  '& > *': {
    content: "''",
    display: 'block',
    position: 'absolute',
    width: '1.4em',
    height: '1.4em',
    top: 'calc(-0.7em + 2px)',
    left: '-0.7em',
    bottom: '0',
    transform: 'scale(0)',
    transition: 'transform 0.3s ease',
    'z-index': '1'
  },

  '& > *:not(svg)': {
    width: '1em',
    height: '1em',
    top: 'calc(-0.5em + 2px)',
    left: '-0.5em',
    'border-radius': '50%',
    'background-color': '#fff'
  }
})

export const hit = $.css({
  position: 'absolute',
  left: '0',
  'border-radius': '4px',
  padding: '5px 8px',
  'background-color': 'var(--shadow-background-color)',
  color: '#fff',
  'word-wrap': 'nowrap',
  'word-break': 'nowrap',
  'z-index': '2',
  'pointer-events': 'none',
  transform: 'translateX(-50%)',
  display: 'none',
  'white-space': 'pre',
  bottom: '15px'
})

export const progressDragging = $.css('/* progressDragging */')

export const progress = $.css({
  position: 'relative',
  'box-sizing': 'border-box',
  padding: '5px 0',
  cursor: 'pointer',
  width: '100%',

  [`&.${progressDragging} .${dot} > * ${!isMobile ? `,&:hover .${dot} > *` : ''}`]: {
    transform: 'scale(1)'
  },

  [`&.${progressDragging} .${hit}, &.${progressDragging} .${thumbnailCls}, &.${progressDragging} .${vttThumbnailsCls}`]:
    {
      display: 'block'
    }
})

export const progressInner = $.css({
  position: 'relative',
  height: '4px',
  width: '100%',
  'background-color': 'hsla(0, 0%, 100%, 0.2)',
  'border-radius': '2px',

  [`& .${buffered}, & .${played}`]: {
    position: 'absolute',
    left: '0',
    top: '0',
    bottom: '0',
    'will-change': 'width',
    'pointer-events': 'none',
    'border-radius': '2px'
  }
})
