/**
 * 下载模块 React Hooks
 */

import { useEffect, useState } from 'react'
import downloadState from './state'

/**
 * 使用下载列表
 */
export const useDownloadList = () => {
  const [list, setList] = useState(downloadState.list)

  useEffect(() => {
    const handler = (newList: LX.Download.ListItem[]) => {
      setList(newList)
    }

    global.state_event.on('downloadListChanged', handler)
    return () => {
      global.state_event.off('downloadListChanged', handler)
    }
  }, [])

  return list
}

/**
 * 使用下载配置
 */
export const useDownloadConfig = () => {
  const [config, setConfig] = useState(downloadState.config)

  useEffect(() => {
    const handler = (newConfig: LX.Download.DownloadConfig) => {
      setConfig(newConfig)
    }

    global.state_event.on('downloadConfigChanged', handler)
    return () => {
      global.state_event.off('downloadConfigChanged', handler)
    }
  }, [])

  return config
}

/**
 * 使用正在运行的下载任务数量
 */
export const useRunningDownloadsCount = () => {
  const [count, setCount] = useState(downloadState.runningIds.length)

  useEffect(() => {
    const handler = (newList: LX.Download.ListItem[]) => {
      const runningCount = newList.filter(item => item.status === 'run').length
      setCount(runningCount)
    }

    global.state_event.on('downloadListChanged', handler)
    return () => {
      global.state_event.off('downloadListChanged', handler)
    }
  }, [])

  return count
}

/**
 * 使用下载统计信息
 */
export const useDownloadStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    waiting: 0,
    paused: 0,
    completed: 0,
    error: 0,
  })

  useEffect(() => {
    const handler = (newList: LX.Download.ListItem[]) => {
      const newStats = {
        total: newList.length,
        running: newList.filter(item => item.status === 'run').length,
        waiting: newList.filter(item => item.status === 'waiting').length,
        paused: newList.filter(item => item.status === 'pause').length,
        completed: newList.filter(item => item.status === 'completed').length,
        error: newList.filter(item => item.status === 'error').length,
      }
      setStats(newStats)
    }

    global.state_event.on('downloadListChanged', handler)
    return () => {
      global.state_event.off('downloadListChanged', handler)
    }
  }, [])

  return stats
}

