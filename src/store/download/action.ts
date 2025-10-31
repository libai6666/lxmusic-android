/**
 * 下载模块动作
 */

import state from './state'

export default {
  /**
   * 设置下载列表
   */
  setList(list: LX.Download.ListItem[]) {
    state.list = list
    global.state_event.downloadListChanged([...state.list])
  },

  /**
   * 添加下载任务
   */
  addTask(task: LX.Download.ListItem) {
    state.list.push(task)
    global.state_event.downloadListChanged([...state.list])
  },

  /**
   * 添加多个下载任务
   */
  addTasks(tasks: LX.Download.ListItem[]) {
    state.list.push(...tasks)
    global.state_event.downloadListChanged([...state.list])
  },

  /**
   * 更新下载任务
   */
  updateTask(taskId: string, updates: Partial<LX.Download.ListItem>) {
    const index = state.list.findIndex(item => item.id === taskId)
    if (index < 0) return

    state.list[index] = {
      ...state.list[index],
      ...updates,
    }
    global.state_event.downloadListChanged([...state.list])
  },

  /**
   * 更新下载任务进度
   */
  updateTaskProgress(taskId: string, progressInfo: LX.Download.ProgressInfo) {
    const index = state.list.findIndex(item => item.id === taskId)
    if (index < 0) return

    state.list[index] = {
      ...state.list[index],
      progress: progressInfo.progress,
      speed: progressInfo.speed,
      downloaded: progressInfo.downloaded,
      total: progressInfo.total,
    }
    global.state_event.downloadListChanged([...state.list])
  },

  /**
   * 更新下载任务状态
   */
  updateTaskStatus(taskId: string, status: LX.Download.DownloadTaskStatus, statusText?: string) {
    const index = state.list.findIndex(item => item.id === taskId)
    if (index < 0) return

    state.list[index] = {
      ...state.list[index],
      status,
      statusText: statusText ?? state.list[index].statusText,
    }

    // 更新运行中的任务列表
    if (status === 'run' && !state.runningIds.includes(taskId)) {
      state.runningIds.push(taskId)
    } else if (status !== 'run' && state.runningIds.includes(taskId)) {
      state.runningIds = state.runningIds.filter(id => id !== taskId)
    }

    global.state_event.downloadListChanged([...state.list])
  },

  /**
   * 移除下载任务
   */
  removeTask(taskId: string) {
    state.list = state.list.filter(item => item.id !== taskId)
    state.runningIds = state.runningIds.filter(id => id !== taskId)
    global.state_event.downloadListChanged([...state.list])
  },

  /**
   * 移除多个下载任务
   */
  removeTasks(taskIds: string[]) {
    const taskIdSet = new Set(taskIds)
    state.list = state.list.filter(item => !taskIdSet.has(item.id))
    state.runningIds = state.runningIds.filter(id => !taskIdSet.has(id))
    global.state_event.downloadListChanged([...state.list])
  },

  /**
   * 清空已完成的任务
   */
  clearCompleted() {
    state.list = state.list.filter(item => item.status !== 'completed')
    global.state_event.downloadListChanged([...state.list])
  },

  /**
   * 清空所有任务
   */
  clearAll() {
    state.list = []
    state.runningIds = []
    global.state_event.downloadListChanged([...state.list])
  },

  /**
   * 设置正在运行的任务ID列表
   */
  setRunningIds(ids: string[]) {
    state.runningIds = ids
  },

  /**
   * 更新下载配置
   */
  updateConfig(config: Partial<LX.Download.DownloadConfig>) {
    state.config = {
      ...state.config,
      ...config,
    }
    global.state_event.downloadConfigChanged({ ...state.config })
  },

  /**
   * 设置下载配置
   */
  setConfig(config: LX.Download.DownloadConfig) {
    state.config = config
    global.state_event.downloadConfigChanged({ ...state.config })
  },

  /**
   * 获取下载任务列表（用于内部逻辑）
   */
  getTaskList(): LX.Download.ListItem[] {
    return state.list
  },

  /**
   * 获取指定任务（用于内部逻辑）
   */
  getTask(taskId: string): LX.Download.ListItem | undefined {
    return state.list.find(item => item.id === taskId)
  },
}

