/**
 * 下载队列控制器
 * 负责管理下载队列和并发控制
 */

import { downloadAction } from '@/store/download'
import { startDownloadTask, pauseDownloadTask, getRunningTaskCount, isTaskRunning } from './taskManager'
import { log } from '@/utils/log'
import downloadState from '@/store/download/state'

/**
 * 处理下载队列
 * 根据配置的最大并发数，自动启动等待中的任务
 */
export const processDownloadQueue = async(): Promise<void> => {
  const maxDownloadNum = downloadState.config.maxDownloadNum
  const runningCount = getRunningTaskCount()

  // 如果已达到最大并发数，不再启动新任务
  if (runningCount >= maxDownloadNum) {
    return
  }

  // 查找等待中的任务
  const taskList = downloadAction.getTaskList()
  const waitingTasks = taskList.filter(task => task.status === 'waiting')

  // 可以启动的任务数量
  const canStartCount = maxDownloadNum - runningCount
  const tasksToStart = waitingTasks.slice(0, canStartCount)

  // 启动任务
  for (const task of tasksToStart) {
    try {
      // 不等待，让任务在后台运行
      void startDownloadTask(task.id).catch((error) => {
        log.error(`下载任务 ${task.id} 执行失败:`, error)
      })
    } catch (error) {
      log.error(`启动下载任务 ${task.id} 失败:`, error)
    }
  }
}

/**
 * 添加下载任务到队列
 */
export const addToDownloadQueue = (musicInfo: LX.Music.MusicInfoOnline, quality?: LX.Quality): void => {
  const config = downloadState.config
  
  // 检查保存路径是否已设置
  if (!config.savePath) {
    log.error('下载路径未设置，无法添加下载任务')
    throw new Error('下载路径未设置')
  }
  
  log.info(`[addToDownloadQueue] 使用下载路径: ${config.savePath}`)
  
  // 使用配置的音质或默认音质
  const downloadQuality = quality || config.downloadQuality
  
  // 生成任务ID
  const taskId = `${musicInfo.id}_${downloadQuality}_${Date.now()}`
  
  // 生成文件名和路径
  const { generateFileName, getFileExt } = require('./taskManager')
  const ext = getFileExt(downloadQuality)
  const fileName = generateFileName(musicInfo, ext)
  const filePath = `${config.savePath}/${fileName}`
  
  log.info(`[addToDownloadQueue] 生成文件路径: ${filePath}`)
  
  // 创建下载任务
  const task: LX.Download.ListItem = {
    id: taskId,
    isComplate: false,
    status: 'waiting',
    statusText: '等待下载',
    downloaded: 0,
    total: 0,
    progress: 0,
    speed: '0 B/s',
    startTime: Date.now(),
    metadata: {
      musicInfo,
      url: null,
      quality: downloadQuality,
      ext,
      fileName,
      filePath,
    },
  }
  
  // 添加到下载列表
  downloadAction.addTask(task)
  
  // 处理队列
  void processDownloadQueue()
}

/**
 * 批量添加下载任务
 */
export const batchAddToDownloadQueue = (musicList: LX.Music.MusicInfoOnline[], quality?: LX.Quality): void => {
  for (const musicInfo of musicList) {
    addToDownloadQueue(musicInfo, quality)
  }
}

/**
 * 启动指定任务
 */
export const startTask = async(taskId: string): Promise<void> => {
  const task = downloadAction.getTask(taskId)
  if (!task) {
    log.error(`任务 ${taskId} 不存在`)
    return
  }

  // 如果任务已在运行，直接返回
  if (isTaskRunning(taskId)) {
    log.warn(`任务 ${taskId} 已在运行中`)
    return
  }

  // 如果任务已完成，不再启动
  if (task.status === 'completed') {
    log.info(`任务 ${taskId} 已完成`)
    return
  }

  // 检查是否达到最大并发数
  const maxDownloadNum = downloadState.config.maxDownloadNum
  const runningCount = getRunningTaskCount()

  if (runningCount >= maxDownloadNum) {
    // 达到最大并发，设置为等待状态
    downloadAction.updateTaskStatus(taskId, 'waiting', '等待下载')
  } else {
    // 可以立即启动
    await startDownloadTask(taskId)
  }
}

/**
 * 暂停指定任务
 */
export const pauseTask = (taskId: string): void => {
  pauseDownloadTask(taskId)
  
  // 暂停后，尝试启动其他等待的任务
  void processDownloadQueue()
}

/**
 * 恢复指定任务
 */
export const resumeTask = async(taskId: string): Promise<void> => {
  const task = downloadAction.getTask(taskId)
  if (!task) {
    log.error(`任务 ${taskId} 不存在`)
    return
  }

  if (task.status !== 'pause' && task.status !== 'error') {
    log.warn(`任务 ${taskId} 状态不正确，无法恢复`)
    return
  }

  // 更新状态为等待
  downloadAction.updateTaskStatus(taskId, 'waiting', '等待下载')
  
  // 处理队列
  void processDownloadQueue()
}

/**
 * 取消指定任务
 */
export const cancelTask = (taskId: string): void => {
  const { cancelDownloadTask } = require('./taskManager')
  cancelDownloadTask(taskId)
  
  // 取消后，尝试启动其他等待的任务
  void processDownloadQueue()
}

/**
 * 重试失败的任务
 */
export const retryTask = async(taskId: string): Promise<void> => {
  const task = downloadAction.getTask(taskId)
  if (!task) {
    log.error(`任务 ${taskId} 不存在`)
    return
  }

  if (task.status !== 'error') {
    log.warn(`任务 ${taskId} 不是错误状态，无法重试`)
    return
  }

  // 重置任务状态
  downloadAction.updateTask(taskId, {
    status: 'waiting',
    statusText: '等待下载',
    metadata: {
      ...task.metadata,
      url: null, // 清空URL，重新获取
    },
  })
  
  // 处理队列
  void processDownloadQueue()
}

/**
 * 暂停所有下载
 */
export const pauseAllTasks = (): void => {
  const taskList = downloadAction.getTaskList()
  const runningTasks = taskList.filter(task => task.status === 'run')
  
  for (const task of runningTasks) {
    pauseDownloadTask(task.id)
  }
}

/**
 * 启动所有等待的任务
 */
export const startAllTasks = (): void => {
  void processDownloadQueue()
}

