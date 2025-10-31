/**
 * 下载模块状态管理
 */

import DEFAULT_SETTING from '@/config/defaultSetting'

export interface InitState {
  /**
   * 下载列表
   */
  list: LX.Download.ListItem[]

  /**
   * 正在运行的下载任务ID列表
   */
  runningIds: string[]

  /**
   * 下载配置
   */
  config: LX.Download.DownloadConfig
}

const state: InitState = {
  list: [],
  runningIds: [],
  config: {
    maxDownloadNum: DEFAULT_SETTING['download.maxDownloadNum'],
    savePath: DEFAULT_SETTING['download.savePath'],
    fileName: DEFAULT_SETTING['download.fileName'],
    downloadQuality: DEFAULT_SETTING['download.downloadQuality'],
  },
}

export default state

