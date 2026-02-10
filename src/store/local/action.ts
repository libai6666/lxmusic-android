/**
 * 本地音乐模块动作
 */

import state, { type LocalMusicInfo, type FolderInfo, type SortType, type SortOrder } from './state'

// 从文件路径或 content URI 中提取实际文件名
const extractFileName = (filePath: string): string => {
  try {
    const decoded = decodeURIComponent(filePath)
    return decoded.split(/[/\\]/).pop() || ''
  } catch {
    return filePath.split(/[/\\]/).pop() || ''
  }
}

const sortList = (list: LocalMusicInfo[], sortType: SortType, sortOrder: SortOrder): LocalMusicInfo[] => {
  const sorted = [...list]
  sorted.sort((a, b) => {
    let compareResult = 0
    switch (sortType) {
      case 'name':
        compareResult = a.name.localeCompare(b.name, 'zh-CN')
        break
      case 'singer':
        compareResult = a.singer.localeCompare(b.singer, 'zh-CN')
        break
      case 'album':
        compareResult = (a.meta.albumName || '').localeCompare(b.meta.albumName || '', 'zh-CN')
        break
      case 'time':
        compareResult = (a.interval || '').localeCompare(b.interval || '')
        break
      case 'addTime':
        compareResult = a.addTime - b.addTime
        break
      case 'size':
        compareResult = a.size - b.size
        break
    }
    return sortOrder === 'asc' ? compareResult : -compareResult
  })
  return sorted
}

export default {
  /**
   * 设置本地音乐列表
   */
  setList(list: LocalMusicInfo[]) {
    state.list = sortList(list, state.sortType, state.sortOrder)
    global.state_event.localListChanged([...state.list])
  },

  /**
   * 添加本地音乐
   */
  addMusic(music: LocalMusicInfo) {
    if (state.excludedIds.includes(music.id)) return false
    const exists = state.list.some(item => item.id === music.id)
    if (exists) return false
    state.list.push(music)
    state.list = sortList(state.list, state.sortType, state.sortOrder)
    global.state_event.localListChanged([...state.list])
    return true
  },

  /**
   * 批量添加本地音乐
   */
  addMusics(musics: LocalMusicInfo[], ignoreExcluded: boolean = false) {
    const existIds = new Set(state.list.map(item => item.id))
    // 基于文件名+大小的二次去重（处理 content URI 和文件路径对同一文件产生不同ID的情况）
    const existFileKeys = new Set(state.list.map(item => {
      return `${extractFileName(item.meta.filePath)}|${item.size}`
    }))
    let newMusics: LocalMusicInfo[]
    if (ignoreExcluded) {
      newMusics = musics.filter(m => {
        if (existIds.has(m.id)) return false
        const fileKey = `${extractFileName(m.meta.filePath)}|${m.size}`
        return !existFileKeys.has(fileKey)
      })
      // 从排除列表中移除这些歌曲，允许后续刷新时保留
      const addedIdSet = new Set(newMusics.map(m => m.id))
      const prevLen = state.excludedIds.length
      state.excludedIds = state.excludedIds.filter(id => !addedIdSet.has(id))
      if (state.excludedIds.length !== prevLen) {
        global.state_event.localExcludedIdsChanged([...state.excludedIds])
      }
    } else {
      const excludedIdSet = new Set(state.excludedIds)
      newMusics = musics.filter(m => {
        if (existIds.has(m.id) || excludedIdSet.has(m.id)) return false
        const fileKey = `${extractFileName(m.meta.filePath)}|${m.size}`
        return !existFileKeys.has(fileKey)
      })
    }
    if (newMusics.length === 0) return 0
    state.list.push(...newMusics)
    state.list = sortList(state.list, state.sortType, state.sortOrder)
    global.state_event.localListChanged([...state.list])
    return newMusics.length
  },

  /**
   * 移除本地音乐
   */
  removeMusic(id: string) {
    state.list = state.list.filter(item => item.id !== id)
    if (!state.excludedIds.includes(id)) {
      state.excludedIds.push(id)
      global.state_event.localExcludedIdsChanged([...state.excludedIds])
    }
    global.state_event.localListChanged([...state.list])
  },

  /**
   * 批量移除本地音乐
   */
  removeMusics(ids: string[]) {
    const idSet = new Set(ids)
    state.list = state.list.filter(item => !idSet.has(item.id))
    const existingExcluded = new Set(state.excludedIds)
    const newExcluded = ids.filter(id => !existingExcluded.has(id))
    if (newExcluded.length > 0) {
      state.excludedIds.push(...newExcluded)
      global.state_event.localExcludedIdsChanged([...state.excludedIds])
    }
    global.state_event.localListChanged([...state.list])
  },

  /**
   * 清空本地音乐列表
   */
  clearList() {
    state.list = []
    state.excludedIds = []
    global.state_event.localExcludedIdsChanged([...state.excludedIds])
    global.state_event.localListChanged([...state.list])
  },

  /**
   * 更新音乐信息
   */
  updateMusic(id: string, info: Partial<LocalMusicInfo>) {
    const index = state.list.findIndex(item => item.id === id)
    if (index < 0) return
    state.list[index] = { ...state.list[index], ...info }
    global.state_event.localListChanged([...state.list])
  },

  /**
   * 设置文件夹列表
   */
  setFolders(folders: FolderInfo[]) {
    state.folders = folders
    global.state_event.localFoldersChanged([...state.folders])
  },

  /**
   * 添加扫描文件夹
   */
  addFolder(folder: FolderInfo) {
    const exists = state.folders.some(f => f.path === folder.path)
    if (exists) return false
    state.folders.push(folder)
    global.state_event.localFoldersChanged([...state.folders])
    return true
  },

  /**
   * 移除扫描文件夹
   */
  removeFolder(path: string) {
    state.folders = state.folders.filter(f => f.path !== path)
    global.state_event.localFoldersChanged([...state.folders])
  },

  /**
   * 设置扫描状态
   */
  setScanning(isScanning: boolean) {
    state.isScanning = isScanning
    global.state_event.localScanningChanged(isScanning)
  },

  /**
   * 更新扫描进度
   */
  updateScanProgress(progress: { current: number, total: number, currentFile: string }) {
    state.scanProgress = progress
    global.state_event.localScanProgressChanged({ ...progress })
  },

  /**
   * 设置排序方式
   */
  setSortType(sortType: SortType) {
    state.sortType = sortType
    state.list = sortList(state.list, state.sortType, state.sortOrder)
    global.state_event.localListChanged([...state.list])
  },

  /**
   * 设置排序顺序
   */
  setSortOrder(sortOrder: SortOrder) {
    state.sortOrder = sortOrder
    state.list = sortList(state.list, state.sortType, state.sortOrder)
    global.state_event.localListChanged([...state.list])
  },

  /**
   * 获取音乐列表
   */
  getList(): LocalMusicInfo[] {
    return state.list
  },

  /**
   * 获取文件夹列表
   */
  getFolders(): FolderInfo[] {
    return state.folders
  },

  /**
   * 设置排除ID列表
   */
  setExcludedIds(ids: string[]) {
    state.excludedIds = ids
  },

  /**
   * 获取排除ID列表
   */
  getExcludedIds(): string[] {
    return state.excludedIds
  },

  /**
   * 清空排除ID列表
   */
  clearExcludedIds() {
    state.excludedIds = []
    global.state_event.localExcludedIdsChanged([...state.excludedIds])
  },
}
