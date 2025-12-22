import { forwardRef, useImperativeHandle, useState, useCallback } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import Modal from './ModalWrapper'
import { type LocalMusicInfo } from '@/store/local/state'

export interface SelectInfo {
  musicInfo: LX.Music.MusicInfoLocal
  index: number
  single: boolean
  selectedList: LocalMusicInfo[]
}

export interface ListMenuType {
  show: (info: SelectInfo, position: { x: number, y: number, w: number, h: number }) => void
  hide: () => void
}

interface Props {
  onPlay: (info: SelectInfo) => void
  onPlayLater: (info: SelectInfo) => void
  onRemove: (info: SelectInfo) => void
  onAdd: (info: SelectInfo) => void
  onDeleteFile: (info: SelectInfo) => void
}

interface MenuItem {
  id: string
  name: string
  icon: string
  action: () => void
}

export default forwardRef<ListMenuType, Props>(({ onPlay, onPlayLater, onRemove, onAdd, onDeleteFile }, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const [visible, setVisible] = useState(false)
  const [selectInfo, setSelectInfo] = useState<SelectInfo | null>(null)

  useImperativeHandle(ref, () => ({
    show: (info, position) => {
      setSelectInfo(info)
      setVisible(true)
    },
    hide: () => {
      setVisible(false)
    },
  }))

  const handleClose = useCallback(() => {
    setVisible(false)
  }, [])

  const handlePlay = useCallback(() => {
    if (selectInfo) onPlay(selectInfo)
    handleClose()
  }, [selectInfo, onPlay, handleClose])

  const handlePlayLater = useCallback(() => {
    if (selectInfo) onPlayLater(selectInfo)
    handleClose()
  }, [selectInfo, onPlayLater, handleClose])

  const handleAdd = useCallback(() => {
    if (selectInfo) onAdd(selectInfo)
    handleClose()
  }, [selectInfo, onAdd, handleClose])

  const handleRemove = useCallback(() => {
    if (selectInfo) onRemove(selectInfo)
    handleClose()
  }, [selectInfo, onRemove, handleClose])

  const handleDeleteFile = useCallback(() => {
    if (selectInfo) onDeleteFile(selectInfo)
    handleClose()
  }, [selectInfo, onDeleteFile, handleClose])

  const menus: MenuItem[] = [
    { id: 'play', name: t('play'), icon: 'play', action: handlePlay },
    { id: 'playLater', name: t('play_later'), icon: 'play', action: handlePlayLater },
    { id: 'add', name: t('add_to'), icon: 'add-music', action: handleAdd },
    { id: 'remove', name: t('local_remove_music'), icon: 'remove', action: handleRemove },
    { id: 'deleteFile', name: t('local_delete_file'), icon: 'remove', action: handleDeleteFile },
  ]

  return (
    <Modal visible={visible} onClose={handleClose}>
      <View style={[styles.container, { backgroundColor: theme['c-content-background'] }]}>
        {selectInfo && (
          <View style={styles.header}>
            <Text numberOfLines={1} size={14} color={theme['c-font']}>
              {selectInfo.selectedList.length > 0
                ? t('list_multi_add_title_first_add') + selectInfo.selectedList.length + t('list_multi_add_title_last')
                : selectInfo.musicInfo.name
              }
            </Text>
          </View>
        )}
        <View style={styles.menuList}>
          {menus.map(menu => (
            <TouchableOpacity
              key={menu.id}
              style={styles.menuItem}
              onPress={menu.action}
            >
              <Icon name={menu.icon} size={18} color={theme['c-font']} />
              <Text size={14} color={theme['c-font']} style={styles.menuText}>{menu.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
          <Text size={14} color={theme['c-font-label']}>{t('cancel')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
})

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    minWidth: 200,
  },
  header: {
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  menuList: {
    paddingVertical: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  menuText: {
    marginLeft: 15,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
})
