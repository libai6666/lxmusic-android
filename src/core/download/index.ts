/**
 * 下载模块主入口
 */

export * from './taskManager'
export * from './queueController'
export * from './storage'

export {
  startDownloadTask,
  pauseDownloadTask,
  cancelDownloadTask,
  generateFileName,
  getFileExt,
} from './taskManager'

export {
  addToDownloadQueue,
  batchAddToDownloadQueue,
  startTask,
  pauseTask,
  resumeTask,
  cancelTask,
  retryTask,
  pauseAllTasks,
  startAllTasks,
  processDownloadQueue,
} from './queueController'

export {
  initDownloadData,
  saveDownloadList,
  loadDownloadList,
  saveDownloadConfig,
  loadDownloadConfig,
  clearDownloadList,
} from './storage'

