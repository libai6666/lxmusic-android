import { useCallback, useRef } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { useLocalList, useLocalStats, useScanning } from '@/store/local'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import List, { type ListType } from './List'
import ListMenu, { type ListMenuType, type SelectInfo } from './ListMenu'
import Header from './Header'
import MultipleModeBar, { type SelectMode, type MultipleModeBarType } from './MultipleModeBar'
import { handlePlay, handlePlayLater, handleRemove, handleDeleteFile } from './listAction'
import ListMusicAdd, { type MusicAddModalType as ListMusicAddType } from '@/components/MusicAddModal'
import ListMusicMultiAdd, { type MusicMultiAddModalType as ListAddMultiType } from '@/components/MusicMultiAddModal'
import { localAction } from '@/store/local'

export default () => {
  const theme = useTheme()
  const t = useI18n()
  const list = useLocalList()
  const stats = useLocalStats()
  const isScanning = useScanning()

  const listRef = useRef<ListType>(null)
  const listMenuRef = useRef<ListMenuType>(null)
  const multipleModeBarRef = useRef<MultipleModeBarType>(null)
  const listMusicAddRef = useRef<ListMusicAddType>(null)
  const listMusicMultiAddRef = useRef<ListAddMultiType>(null)
  const isShowMultipleModeBar = useRef(false)

  const handleMultiSelect = useCallback(() => {
    isShowMultipleModeBar.current = true
    multipleModeBarRef.current?.show()
    listRef.current?.setIsMultiSelectMode(true)
  }, [])

  const handleExitSelect = useCallback(() => {
    multipleModeBarRef.current?.exitSelectMode()
    listRef.current?.setIsMultiSelectMode(false)
    isShowMultipleModeBar.current = false
  }, [])

  const handleSwitchSelectMode = useCallback((mode: SelectMode) => {
    multipleModeBarRef.current?.setSwitchMode(mode)
    listRef.current?.setSelectMode(mode)
  }, [])

  const showMenu = useCallback((musicInfo: LX.Music.MusicInfoLocal, index: number, position: { x: number, y: number, w: number, h: number }) => {
    listMenuRef.current?.show({
      musicInfo,
      index,
      single: false,
      selectedList: listRef.current!.getSelectedList(),
    }, position)
  }, [])

  const handleAddMusic = useCallback((info: SelectInfo) => {
    if (info.selectedList.length) {
      listMusicMultiAddRef.current?.show({ selectedList: info.selectedList, listId: '', isMove: false })
    } else {
      listMusicAddRef.current?.show({ musicInfo: info.musicInfo, listId: '', isMove: false })
    }
  }, [])

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
  }

  return (
    <View style={styles.container}>
      <Header />
      <View style={[styles.statsBar, { backgroundColor: theme['c-primary-background'] }]}>
        <Text size={12} color={theme['c-font-label']}>
          {t('local_total_count', { count: stats.total })}
          {'  '}
          {t('local_total_size', { size: formatSize(stats.totalSize) })}
        </Text>
        {isScanning && (
          <View style={styles.scanningIndicator}>
            <Text size={12} color={theme['c-primary-font']}>{t('local_scanning')}</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, zIndex: 1 }}>
        <MultipleModeBar
          ref={multipleModeBarRef}
          onSwitchMode={handleSwitchSelectMode}
          onSelectAll={isAll => listRef.current?.selectAll(isAll)}
          onExitSelectMode={handleExitSelect}
          onAddToList={() => {
            const selected = listRef.current?.getSelectedList() || []
            if (selected.length > 0) {
              listMusicMultiAddRef.current?.show({ selectedList: selected, listId: '', isMove: false })
            }
          }}
          onRemove={() => {
            const selected = listRef.current?.getSelectedList() || []
            if (selected.length > 0) {
              handleRemove(selected[0], selected, handleExitSelect)
            }
          }}
          onDeleteFile={() => {
            const selected = listRef.current?.getSelectedList() || []
            if (selected.length > 0) {
              handleDeleteFile(selected[0], selected, handleExitSelect)
            }
          }}
        />
        <List
          ref={listRef}
          list={list}
          onShowMenu={showMenu}
          onMultiSelectMode={handleMultiSelect}
          onSelectAll={isAll => multipleModeBarRef.current?.setIsSelectAll(isAll)}
          onPlay={handlePlay}
        />
      </View>
      <ListMusicAdd ref={listMusicAddRef} onAdded={handleExitSelect} />
      <ListMusicMultiAdd ref={listMusicMultiAddRef} onAdded={handleExitSelect} />
      <ListMenu
        ref={listMenuRef}
        onPlay={info => { handlePlay(info.index) }}
        onPlayLater={info => { handlePlayLater(info.musicInfo, info.selectedList, handleExitSelect) }}
        onRemove={info => { handleRemove(info.musicInfo, info.selectedList, handleExitSelect) }}
        onAdd={handleAddMusic}
        onDeleteFile={info => { handleDeleteFile(info.musicInfo, info.selectedList, handleExitSelect) }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
