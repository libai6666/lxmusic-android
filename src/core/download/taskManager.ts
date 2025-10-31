/**
 * 下载任务管理器
 * 负责单个下载任务的生命周期管理
 */

import { downloadFile, stopDownload, existsFile, mkdir, stat } from '@/utils/fs'
import RNFS from 'react-native-fs'
import { getMusicUrl } from '@/core/music/online'
import { downloadAction } from '@/store/download'
import { log } from '@/utils/log'
import settingState from '@/store/setting/state'

// 下载任务实例映射
const downloadTasks = new Map<string, {
  jobId: number
  promise: Promise<void>
}>()

/**
 * 格式化文件大小
 */
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`
}

/**
 * 格式化下载速度
 */
const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond === 0) return '0 B/s'
  return `${formatSize(bytesPerSecond)}/s`
}

/**
 * 根据文件名模板生成文件名
 */
export const generateFileName = (musicInfo: LX.Music.MusicInfoOnline, ext: string): string => {
  const fileName = settingState.setting['download.fileName']
  const name = musicInfo.name.replace(/[<>:"/\\|?*]+/g, '')
  const singer = musicInfo.singer.replace(/[<>:"/\\|?*]+/g, '')
  
  let result = ''
  switch (fileName) {
    case '歌手 - 歌名':
      result = `${singer} - ${name}`
      break
    case '歌名':
      result = name
      break
    case '歌名 - 歌手':
    default:
      result = `${name} - ${singer}`
      break
  }
  
  return `${result}.${ext}`
}

/**
 * 获取音质对应的文件扩展名
 */
export const getFileExt = (quality: LX.Quality): LX.Download.FileExt => {
  switch (quality) {
    case 'flac':
    case 'flac24bit':
      return 'flac'
    case 'wav':
      return 'wav'
    case 'ape':
      return 'ape'
    case '128k':
    case '192k':
    case '320k':
    default:
      return 'mp3'
  }
}

/**
 * 确保保存目录存在（使用 RNFS，递归创建所有父目录）
 */
const ensureSaveDir = async(dirPath: string): Promise<void> => {
  try {
    log.info(`[ensureSaveDir] 开始检查目录: ${dirPath}`)
    
    // 使用 RNFS 检查目录是否存在
    const exists = await RNFS.exists(dirPath)
    log.info(`[ensureSaveDir] 目录存在性检查: ${exists}`)
    
    if (!exists) {
      // 分割路径，逐级创建
      const parts = dirPath.split('/').filter(p => p)
      log.info(`[ensureSaveDir] 需要创建的路径层级: ${parts.join(' -> ')}`)
      
      let currentPath = ''
      for (let i = 0; i < parts.length; i++) {
        currentPath += '/' + parts[i]
        
        try {
          const partExists = await RNFS.exists(currentPath)
          if (!partExists) {
            log.info(`[ensureSaveDir] 创建目录层级 [${i + 1}/${parts.length}]: ${currentPath}`)
            await RNFS.mkdir(currentPath)
            log.info(`[ensureSaveDir] 创建成功: ${currentPath}`)
          } else {
            log.info(`[ensureSaveDir] 目录层级已存在 [${i + 1}/${parts.length}]: ${currentPath}`)
          }
        } catch (mkdirError: any) {
          // 如果是"目录已存在"错误，忽略
          if (mkdirError.message?.includes('already exists') || mkdirError.message?.includes('File exists')) {
            log.info(`[ensureSaveDir] 目录已存在（忽略错误）: ${currentPath}`)
            continue
          }
          log.error(`[ensureSaveDir] 创建目录层级失败: ${currentPath}`, mkdirError)
          throw mkdirError
        }
      }
      
      // 最终验证
      const finalExists = await RNFS.exists(dirPath)
      log.info(`[ensureSaveDir] 最终验证目录存在: ${finalExists}`)
      
      if (!finalExists) {
        throw new Error(`目录创建失败：${dirPath} 创建后验证不存在`)
      }
      
      log.info(`[ensureSaveDir] 目录创建完成: ${dirPath}`)
    } else {
      log.info(`[ensureSaveDir] 目录已存在，无需创建: ${dirPath}`)
    }
  } catch (error: any) {
    log.error(`[ensureSaveDir] 确保目录存在时出错: ${error.message}`, error)
    throw error
  }
}

/**
 * 启动下载任务
 */
export const startDownloadTask = async(taskId: string): Promise<void> => {
  // 如果任务已在运行，直接返回
  if (downloadTasks.has(taskId)) {
    log.warn(`下载任务 ${taskId} 已在运行中`)
    return
  }

  // 查找任务信息
  const taskList = downloadAction.getTaskList()
  const task = taskList.find(t => t.id === taskId)
  if (!task) {
    log.error(`下载任务 ${taskId} 不存在`)
    return
  }

  // 如果已完成，不再下载
  if (task.status === 'completed') {
    log.info(`下载任务 ${taskId} 已完成`)
    return
  }

  // 确保保存目录存在
  const dirPath = task.metadata.filePath.substring(0, task.metadata.filePath.lastIndexOf('/'))
  log.info(`准备创建下载目录: ${dirPath}`)
  
  try {
    await ensureSaveDir(dirPath)
    log.info(`下载目录创建成功: ${dirPath}`)
  } catch (error: any) {
    log.error(`创建保存目录失败: ${error.message}`, error)
    downloadAction.updateTaskStatus(taskId, 'error', `创建保存目录失败: ${error.message}`)
    return
  }

  // 更新状态为运行中
  downloadAction.updateTaskStatus(taskId, 'run', '正在获取下载链接...')

  try {
    // 获取音乐URL
    let url = task.metadata.url
    if (!url) {
      url = await getMusicUrl({
        musicInfo: task.metadata.musicInfo,
        quality: task.metadata.quality,
        isRefresh: true,
        allowToggleSource: false,
      })
      
      // 更新URL到任务
      downloadAction.updateTask(taskId, {
        metadata: {
          ...task.metadata,
          url,
        },
      })
    }

    // 检查文件是否已存在
    const fileExists = await existsFile(task.metadata.filePath)
    if (fileExists) {
      // 文件已存在，标记为完成
      const fileStat = await stat(task.metadata.filePath)
      downloadAction.updateTask(taskId, {
        status: 'completed',
        isComplate: true,
        statusText: '下载完成',
        progress: 1,
        downloaded: fileStat.size,
        total: fileStat.size,
        finishTime: Date.now(),
      })
      return
    }

    // 开始下载
    downloadAction.updateTaskStatus(taskId, 'run', '正在下载...')

    const promise = new Promise<void>((resolve, reject) => {
      const { jobId, promise: downloadPromise } = downloadFile(url!, task.metadata.filePath, {
        begin: (res) => {
          const total = res.contentLength || 0
          downloadAction.updateTask(taskId, {
            total,
            downloaded: 0,
            progress: 0,
            speed: '0 B/s',
          })
        },
        progress: (res) => {
          const downloaded = res.bytesWritten
          const total = res.contentLength
          const progress = total > 0 ? downloaded / total : 0
          const elapsedSeconds = (Date.now() - task.startTime) / 1000
          const speed = elapsedSeconds > 0 ? formatSpeed(Math.floor(res.bytesWritten / elapsedSeconds)) : '0 B/s'

          downloadAction.updateTaskProgress(taskId, {
            progress,
            speed,
            downloaded,
            total,
          })
        },
      })

      // 保存jobId
      downloadAction.updateTask(taskId, { jobId })
      downloadTasks.set(taskId, { jobId, promise })

      downloadPromise
        .then((result) => {
          if (result.statusCode === 200) {
            // 下载成功
            downloadAction.updateTask(taskId, {
              status: 'completed',
              isComplate: true,
              statusText: '下载完成',
              progress: 1,
              finishTime: Date.now(),
            })
            resolve()
          } else {
            reject(new Error(`下载失败: HTTP ${result.statusCode}`))
          }
        })
        .catch(reject)
        .finally(() => {
          downloadTasks.delete(taskId)
        })
    })

    await promise
  } catch (error: any) {
    log.error(`下载任务 ${taskId} 失败:`, error)
    downloadAction.updateTask(taskId, {
      status: 'error',
      statusText: `下载失败: ${error.message || '未知错误'}`,
      retryCount: (task.retryCount || 0) + 1,
    })
    downloadTasks.delete(taskId)
    throw error
  }
}

/**
 * 暂停下载任务
 */
export const pauseDownloadTask = (taskId: string): void => {
  const taskInfo = downloadTasks.get(taskId)
  if (!taskInfo) {
    log.warn(`下载任务 ${taskId} 不在运行中`)
    return
  }

  // 停止下载
  stopDownload(taskInfo.jobId)
  downloadTasks.delete(taskId)

  // 更新状态
  downloadAction.updateTaskStatus(taskId, 'pause', '已暂停')
}

/**
 * 取消下载任务
 */
export const cancelDownloadTask = (taskId: string): void => {
  const taskInfo = downloadTasks.get(taskId)
  if (taskInfo) {
    stopDownload(taskInfo.jobId)
    downloadTasks.delete(taskId)
  }

  // 移除任务
  downloadAction.removeTask(taskId)
}

/**
 * 获取正在运行的任务数量
 */
export const getRunningTaskCount = (): number => {
  return downloadTasks.size
}

/**
 * 检查任务是否正在运行
 */
export const isTaskRunning = (taskId: string): boolean => {
  return downloadTasks.has(taskId)
}

