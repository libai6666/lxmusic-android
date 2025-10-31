/**
 * 下载任务管理器
 * 负责单个下载任务的生命周期管理
 */

import { downloadFile, stopDownload, existsFile, mkdir, stat, writeFile } from '@/utils/fs'
import RNFS from 'react-native-fs'
import { getMusicUrl } from '@/core/music/online'
import { getPicUrl, getLyricInfo } from '@/core/music/online'
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
 * 嵌入元数据（下载封面和歌词文件）
 * 使用 setImmediate 确保不阻塞主线程
 */
const embedMetadata = async(taskId: string, task: LX.Download.ListItem): Promise<void> => {
  // 延迟执行，让主线程保持响应
  await new Promise(resolve => setImmediate(resolve))
  
  const setting = settingState.setting
  const musicInfo = task.metadata.musicInfo
  
  // 获取文件路径（去掉扩展名）
  const baseFilePath = task.metadata.filePath.replace(/\.[^/.]+$/, '')
  
  log.info(`[embedMetadata] 开始处理元数据: ${musicInfo.name}`)
  
  // 下载封面
  if (setting['download.embedCover']) {
    try {
      log.info('[embedMetadata] 正在获取封面...')
      const picUrl = await getPicUrl({ 
        musicInfo, 
        listId: '', 
        isRefresh: false 
      })
      
      if (picUrl && picUrl.startsWith('http')) {
        log.info(`[embedMetadata] 封面URL: ${picUrl}`)
        const coverPath = `${baseFilePath}.jpg`
        
        // 下载封面
        const { promise } = RNFS.downloadFile({
          fromUrl: picUrl,
          toFile: coverPath,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36',
          },
        })
        
        const result = await promise
        if (result.statusCode === 200) {
          log.info(`[embedMetadata] 封面下载成功: ${coverPath}`)
        } else {
          log.warn(`[embedMetadata] 封面下载失败: HTTP ${result.statusCode}`)
        }
      } else {
        log.info('[embedMetadata] 未找到封面URL')
      }
    } catch (error: any) {
      log.error(`[embedMetadata] 下载封面失败: ${error.message}`)
    }
  }
  
  // 让出主线程
  await new Promise(resolve => setImmediate(resolve))
  
  // 下载歌词
  if (setting['download.embedLyric']) {
    try {
      log.info('[embedMetadata] 正在获取歌词...')
      const lyricInfo = await getLyricInfo({ 
        musicInfo, 
        isRefresh: false 
      })
      
      if (lyricInfo && lyricInfo.lyric) {
        const lrcPath = `${baseFilePath}.lrc`
        let lrcContent = lyricInfo.lyric
        
        // 添加翻译歌词
        if (setting['download.embedLyricTranslation'] && lyricInfo.tlyric) {
          lrcContent = mergeLyrics(lrcContent, lyricInfo.tlyric)
        }
        
        // 添加罗马音
        if (setting['download.embedLyricRoma'] && lyricInfo.rlyric) {
          lrcContent = mergeLyrics(lrcContent, lyricInfo.rlyric)
        }
        
        await writeFile(lrcPath, lrcContent, 'utf8')
        log.info(`[embedMetadata] 歌词保存成功: ${lrcPath}`)
      } else {
        log.info('[embedMetadata] 未找到歌词')
      }
    } catch (error: any) {
      log.error(`[embedMetadata] 保存歌词失败: ${error.message}`)
    }
  }
  
  log.info('[embedMetadata] 元数据处理完成')
}

/**
 * 合并歌词（简单合并，不做复杂的时间轴匹配）
 */
const mergeLyrics = (original: string, translation: string): string => {
  return `${original}\n\n${translation}`
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
            // 标记为完成（立即返回，不等待元数据）
            downloadAction.updateTask(taskId, {
              status: 'completed',
              isComplate: true,
              statusText: '下载完成',
              progress: 1,
              finishTime: Date.now(),
            })
            
            // 异步处理元数据（不阻塞主流程）
            void embedMetadata(taskId, task).catch((error: any) => {
              log.error(`嵌入元数据失败（不影响下载）: ${error.message}`, error)
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

