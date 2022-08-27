export type Subtitle = {
  default?: boolean
  name?: string
  url: string
  encoding?: string
  type?: string
}

export type Setting = {
  name: string
  key?: string // children 可无 （用于移除）
  /**
   * selector 切换下个面板单选 1 ｜ 2 ｜ 3
   * swither  当前面板切换 true or false
   */
  type?: 'selector' | 'switcher'
  icon?: string
  children?: Setting[]
  onChange?: (a: any /* Setting | boolean */, b?: { index?: number; isInit?: boolean }) => void
  default?: any
  [x: string]: any
}

export type Thumbnails = {
  url: string
  number: number
  width?: number
  height?: number
}

export type Highlight = {
  text: string
  time: number
}

export type UiConfig = {
  theme?: {
    primaryColor: `#${string}`
  }
  /**
   * default: false
   */
  autoFocus?: boolean
  /**
   * default: true
   */
  hotkey?: boolean
  /**
   * default: ['2.0', '1.75', '1.25', '1.0', '0.75', '0.5']
   */
  speed?: string[]
  /**
   * default: false
   */
  screenshot?: boolean
  /**
   * default: true
   */
  fullscreen?: boolean
  /**
   * default: false
   */
  fullscreenWeb?: boolean
  /**
   * default: true
   */
  pictureInPicture?: boolean
  /**
   * default: true
   */
  miniProgressBar?: boolean

  subtitle?: Subtitle[]

  settings?: Setting[]

  thumbnails?: Thumbnails

  highlight?: Highlight[]

  /*  --- WIP ---  */

  contextmenu?: []

  airplay?: boolean
}
