export type DanmakuItem = {
  text: string
  time: number
  /**
   * 0 scroll
   * 1 static
   */
  mode: number
  fontSize: number
  color?: string
  timestamp: number
  pool: number
  userID: string
  rowID: number
  border?: string
}

export type QueueItem = DanmakuItem & {
  status: 'wait' | 'emit' | 'ready' | 'stop'
  $ref: HTMLDivElement | null
  restTime: number
  lastTime: number
}

export type ActiveDanmakuRect = {
  top: number
  left: number
  right: number
  height: number
  width: number
  speed: number
  distance: number
  time?: number
  mode?: number
}

export type RootRect = {
  target: {
    mode: number
    height: number
    speed: number
  }
  emits: ActiveDanmakuRect[]
  clientWidth: number
  clientHeight: number
  marginBottom: number
  marginTop: number
  antiOverlap: boolean
}

export type Options = {
  source: string | Function | DanmakuItem[]
  speed?: number // 持续时间 秒，[1 ~ 10]
  antiOverlap?: boolean // 是否防重叠
  useWorker?: boolean
  synchronousPlayback?: boolean // 是否同步到播放速度
  opacity?: number
  fontSize?: number
  color?: string
  margin?: [number, number]
  filter?: (danmaku: DanmakuItem) => boolean
}

export type _Options = Omit<Required<Options>, 'opacity' | 'fontSize' | 'color' | 'filter'> & {
  opacity?: number
  fontSize?: number
  color?: string
  filter?: (danmaku: DanmakuItem) => boolean
}
