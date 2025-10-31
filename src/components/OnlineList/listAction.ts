import { LIST_IDS } from '@/config/constant'
import { addListMusics } from '@/core/list'
import { playList, playNext } from '@/core/player/player'
import { addTempPlayList } from '@/core/player/tempPlayList'
import settingState from '@/store/setting/state'
import { getListMusicSync } from '@/utils/listManage'
import { confirmDialog, openUrl, shareMusic, toast } from '@/utils/tools'
import { addDislikeInfo, hasDislike } from '@/core/dislikeList'
import playerState from '@/store/player/state'
import musicSdk from '@/utils/musicSdk'
import { toOldMusicInfo } from '@/utils'
import { addToDownloadQueue } from '@/core/download'
import { externalStorageDirectoryPath } from '@/utils/fs'

export const handlePlay = (musicInfo: LX.Music.MusicInfoOnline) => {
  void addListMusics(LIST_IDS.DEFAULT, [musicInfo], settingState.setting['list.addMusicLocationType']).then(() => {
    const index = getListMusicSync(LIST_IDS.DEFAULT).findIndex(m => m.id == musicInfo.id)
    if (index < 0) return
    void playList(LIST_IDS.DEFAULT, index)
  })
}
export const handlePlayLater = (musicInfo: LX.Music.MusicInfoOnline, selectedList: LX.Music.MusicInfoOnline[], onCancelSelect: () => void) => {
  if (selectedList.length) {
    addTempPlayList(selectedList.map(s => ({ listId: '', musicInfo: s })))
    onCancelSelect()
  } else {
    addTempPlayList([{ listId: '', musicInfo }])
  }
}


export const handleShare = (musicInfo: LX.Music.MusicInfoOnline) => {
  shareMusic(settingState.setting['common.shareType'], settingState.setting['download.fileName'], musicInfo)
}

export const handleShowMusicSourceDetail = async(minfo: LX.Music.MusicInfoOnline) => {
  const url = musicSdk[minfo.source as LX.OnlineSource]?.getMusicDetailPageUrl(toOldMusicInfo(minfo))
  if (!url) return
  void openUrl(url)
}


export const handleDislikeMusic = async(musicInfo: LX.Music.MusicInfoOnline) => {
  const confirm = await confirmDialog({
    message: musicInfo.singer ? global.i18n.t('lists_dislike_music_singer_tip', { name: musicInfo.name, singer: musicInfo.singer }) : global.i18n.t('lists_dislike_music_tip', { name: musicInfo.name }),
    cancelButtonText: global.i18n.t('cancel_button_text_2'),
    confirmButtonText: global.i18n.t('confirm_button_text'),
    bgClose: false,
  })
  if (!confirm) return
  await addDislikeInfo([{ name: musicInfo.name, singer: musicInfo.singer }])
  toast(global.i18n.t('lists_dislike_music_add_tip'))
  if (hasDislike(playerState.playMusicInfo.musicInfo)) {
    void playNext(true)
  }
}

// 权限检查状态缓存
let hasStoragePermissionCache: boolean | null = null

export const handleDownload = (musicInfo: LX.Music.MusicInfoOnline, selectedList?: LX.Music.MusicInfoOnline[]) => {
  // 立即添加到下载队列（不阻塞UI）
  if (selectedList && selectedList.length > 0) {
    selectedList.forEach(music => {
      addToDownloadQueue(music)
    })
    toast(global.i18n.t('download_add_success'))
  } else {
    addToDownloadQueue(musicInfo)
    toast(global.i18n.t('download_add_success'))
  }

  // 异步检查权限（不阻塞UI）
  void (async() => {
    // 如果已经检查过权限，直接返回
    if (hasStoragePermissionCache !== null) {
      return
    }

    try {
      const { requestStoragePermission } = await import('@/utils/tools')
      const hasPermission = await requestStoragePermission()
      hasStoragePermissionCache = hasPermission
      
      if (!hasPermission) {
        toast(global.i18n.t('storage_permission_tip_request'))
      }
    } catch (error) {
      console.log('权限检查失败:', error)
      // 权限检查失败时继续执行，因为可能是设备不需要权限
      hasStoragePermissionCache = true
    }
  })()
}

