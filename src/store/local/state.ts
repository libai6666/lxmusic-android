/**
 * 本地音乐模块状态管理
 */

export type SortType = 'name' | 'singer' | 'album' | 'time' | 'addTime' | 'size'
export type SortOrder = 'asc' | 'desc'

export interface FolderInfo {
  path: string
  name: string
  addTime: number
}

export interface LocalMusicInfo extends LX.Music.MusicInfoLocal {
  addTime: number
  size: number
}

export interface InitState {
  /**
   * 本地音乐列表
   */
  list: LocalMusicInfo[]

  /**
   * 扫描的文件夹列表
   */
  folders: FolderInfo[]

  /**
   * 是否正在扫描
   */
  isScanning: boolean

  /**
   * 扫描进度信息
   */
  scanProgress: {
    current: number
    total: number
    currentFile: string
  }

  /**
   * 排序方式
   */
  sortType: SortType

  /**
   * 排序顺序
   */
  sortOrder: SortOrder

  /**
   * 用户手动移除的歌曲ID列表（扫描时排除）
   */
  excludedIds: string[]
}

const state: InitState = {
  list: [],
  folders: [],
  isScanning: false,
  scanProgress: {
    current: 0,
    total: 0,
    currentFile: '',
  },
  sortType: 'addTime',
  sortOrder: 'desc',
  excludedIds: [],
}

export default state
