import { localAction } from '@/store/local'
import { getLocalMusicList, saveLocalMusicList, getLocalFolders, saveLocalFolders, getLocalExcludedIds, saveLocalExcludedIds } from '@/utils/data'
import { throttle } from '@/utils/common'

const saveLocalListThrottle = throttle(() => {
  void saveLocalMusicList(localAction.getList())
}, 2000)

// Immediate save for clear operation
export const saveLocalListNow = () => {
  void saveLocalMusicList(localAction.getList())
}

export const saveLocalExcludedIdsNow = () => {
  void saveLocalExcludedIds(localAction.getExcludedIds())
}

const saveLocalFoldersThrottle = throttle(() => {
  void saveLocalFolders(localAction.getFolders())
}, 1000)

const saveLocalExcludedIdsThrottle = throttle(() => {
  void saveLocalExcludedIds(localAction.getExcludedIds())
}, 2000)

export const initLocalMusic = async() => {
  // Load saved data
  const [list, folders, excludedIds] = await Promise.all([
    getLocalMusicList(),
    getLocalFolders(),
    getLocalExcludedIds(),
  ])

  if (list.length) {
    localAction.setList(list)
  }
  if (folders.length) {
    localAction.setFolders(folders)
  }
  if (excludedIds.length) {
    localAction.setExcludedIds(excludedIds)
  }

  // Subscribe to changes and save
  global.state_event.on('localListChanged', () => {
    saveLocalListThrottle()
  })

  global.state_event.on('localFoldersChanged', () => {
    saveLocalFoldersThrottle()
  })

  global.state_event.on('localExcludedIdsChanged', () => {
    saveLocalExcludedIdsThrottle()
  })
}
