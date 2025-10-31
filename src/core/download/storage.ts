/**
 * 下载数据持久化工具
 */

import { getData, saveData } from '@/plugins/storage'
import { storageDataPrefix } from '@/config/constant'
import { log } from '@/utils/log'
import { downloadAction } from '@/store/download'

const downloadListKey = `${storageDataPrefix.list}download`
const downloadConfigKey = '@download_config'

/**
 * 保存下载列表到存储
 */
export const saveDownloadList = async(list: LX.Download.ListItem[]): Promise<void> => {
  try {
    await saveData(downloadListKey, list)
  } catch (error) {
    log.error('保存下载列表失败:', error)
  }
}

/**
 * 从存储加载下载列表
 */
export const loadDownloadList = async(): Promise<LX.Download.ListItem[]> => {
  try {
    const list = await getData<LX.Download.ListItem[]>(downloadListKey)
    return list || []
  } catch (error) {
    log.error('加载下载列表失败:', error)
    return []
  }
}

/**
 * 保存下载配置到存储
 */
export const saveDownloadConfig = async(config: LX.Download.DownloadConfig): Promise<void> => {
  try {
    await saveData(downloadConfigKey, config)
  } catch (error) {
    log.error('保存下载配置失败:', error)
  }
}

/**
 * 从存储加载下载配置
 */
export const loadDownloadConfig = async(): Promise<LX.Download.DownloadConfig | null> => {
  try {
    const config = await getData<LX.Download.DownloadConfig>(downloadConfigKey)
    return config
  } catch (error) {
    log.error('加载下载配置失败:', error)
    return null
  }
}

/**
 * 清空下载列表存储
 */
export const clearDownloadList = async(): Promise<void> => {
  try {
    await saveData(downloadListKey, [])
  } catch (error) {
    log.error('清空下载列表失败:', error)
  }
}

/**
 * 自动保存下载列表（节流）
 * 在下载列表变化时自动调用
 */
let saveTimer: NodeJS.Timeout | null = null
export const autoSaveDownloadList = (list: LX.Download.ListItem[]): void => {
  if (saveTimer) {
    clearTimeout(saveTimer)
  }
  
  saveTimer = setTimeout(() => {
    void saveDownloadList(list)
    saveTimer = null
  }, 1000) // 1秒后保存
}

/**
 * 监听下载列表变化并自动保存
 */
export const watchDownloadListChanges = (): void => {
  global.state_event.on('downloadListChanged', (list) => {
    autoSaveDownloadList(list)
  })
}

/**
 * 初始化下载数据
 * 从存储加载数据并设置到store
 */
export const initDownloadData = async(): Promise<void> => {
  try {
    // 加载下载列表
    const list = await loadDownloadList()
    
    // 过滤掉正在运行的任务，将它们设置为暂停状态
    const processedList = list.map(task => {
      if (task.status === 'run') {
        return {
          ...task,
          status: 'pause' as LX.Download.DownloadTaskStatus,
          statusText: '已暂停',
        }
      }
      return task
    })
    
    downloadAction.setList(processedList)
    
    // 加载下载配置
    const config = await loadDownloadConfig()
    if (config) {
      downloadAction.setConfig(config)
    }
    
    // 开始监听变化
    watchDownloadListChanges()
    
    log.info('下载数据初始化完成')
  } catch (error) {
    log.error('初始化下载数据失败:', error)
  }
}

