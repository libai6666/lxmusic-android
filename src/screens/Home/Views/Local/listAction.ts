import { localAction, type LocalMusicInfo } from '@/store/local'
import { confirmDialog, toast } from '@/utils/tools'
import { playList } from '@/core/player/player'
import { addTempPlayList } from '@/core/player/tempPlayList'
import { unlink } from '@/utils/fs'

export const handlePlay = async(index: number) => {
  const list = localAction.getList()
  if (list.length === 0) return
  await playList('local', index)
}

export const handlePlayAll = async() => {
  const list = localAction.getList()
  if (list.length === 0) return
  await playList('local', 0)
}

export const handlePlayLater = (
  musicInfo: LX.Music.MusicInfoLocal,
  selectedList: LocalMusicInfo[],
  onDone: () => void
) => {
  if (selectedList.length) {
    addTempPlayList(selectedList.map(s => ({ listId: 'local', musicInfo: s })))
    onDone()
  } else {
    addTempPlayList([{ listId: 'local', musicInfo }])
  }
}

export const handleRemove = async(
  musicInfo: LX.Music.MusicInfoLocal,
  selectedList: LocalMusicInfo[],
  onDone: () => void
) => {
  const list = selectedList.length > 0 ? selectedList : [musicInfo as LocalMusicInfo]
  const message = list.length > 1
    ? global.i18n.t('local_remove_music_multi_tip', { count: list.length })
    : global.i18n.t('local_remove_music_tip', { name: list[0].name })

  const confirmed = await confirmDialog({
    message,
    confirmButtonText: global.i18n.t('confirm'),
    cancelButtonText: global.i18n.t('cancel'),
  })

  if (confirmed) {
    localAction.removeMusics(list.map(item => item.id))
    toast(global.i18n.t('list_edit_action_tip_remove_success'))
    onDone()
  }
}

export const handleAddToList = (
  musicInfo: LX.Music.MusicInfoLocal,
  selectedList: LocalMusicInfo[]
) => {
  // This will be handled by MusicAddModal
}

export const handleDeleteFile = async(
  musicInfo: LX.Music.MusicInfoLocal,
  selectedList: LocalMusicInfo[],
  onDone: () => void
) => {
  const list = selectedList.length > 0 ? selectedList : [musicInfo as LocalMusicInfo]
  const message = list.length > 1
    ? global.i18n.t('local_delete_file_multi_tip', { count: list.length })
    : global.i18n.t('local_delete_file_tip', { name: list[0].name })

  const confirmed = await confirmDialog({
    message,
    confirmButtonText: global.i18n.t('confirm'),
    cancelButtonText: global.i18n.t('cancel'),
  })

  if (confirmed) {
    let successCount = 0
    let failCount = 0
    for (const item of list) {
      try {
        await unlink(item.meta.filePath)
        successCount++
      } catch (e) {
        console.error('Failed to delete file:', item.meta.filePath, e)
        failCount++
      }
    }
    localAction.removeMusics(list.map(item => item.id))
    if (failCount > 0) {
      toast(global.i18n.t('local_delete_file_partial', { success: successCount, fail: failCount }))
    } else {
      toast(global.i18n.t('local_delete_file_success', { count: successCount }))
    }
    onDone()
  }
}
