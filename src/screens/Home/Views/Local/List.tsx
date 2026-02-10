import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { View, FlatList, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { type LocalMusicInfo } from '@/store/local/state'
import ListItem, { ITEM_HEIGHT } from './ListItem'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { usePlayMusicInfo } from '@/store/player/hook'

export interface ListType {
  setIsMultiSelectMode: (isMulti: boolean) => void
  setSelectMode: (mode: 'single' | 'range') => void
  selectAll: (isAll: boolean) => void
  getSelectedList: () => LocalMusicInfo[]
  scrollToTop: () => void
}

interface Props {
  list: LocalMusicInfo[]
  onShowMenu: (musicInfo: LX.Music.MusicInfoLocal, index: number, position: { x: number, y: number, w: number, h: number }) => void
  onMultiSelectMode: () => void
  onSelectAll: (isAll: boolean) => void
  onPlay: (index: number) => void
}

export default forwardRef<ListType, Props>(({ list, onShowMenu, onMultiSelectMode, onSelectAll, onPlay }, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const flatListRef = useRef<FlatList>(null)
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectMode, setSelectMode] = useState<'single' | 'range'>('single')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const lastSelectedIndexRef = useRef(-1)

  useImperativeHandle(ref, () => ({
    setIsMultiSelectMode: (isMulti: boolean) => {
      setIsMultiSelectMode(isMulti)
      if (!isMulti) {
        setSelectedIds(new Set())
        lastSelectedIndexRef.current = -1
      }
    },
    setSelectMode: (mode: 'single' | 'range') => {
      setSelectMode(mode)
    },
    selectAll: (isAll: boolean) => {
      if (isAll) {
        setSelectedIds(new Set(list.map(item => item.id)))
      } else {
        setSelectedIds(new Set())
      }
    },
    getSelectedList: () => {
      return list.filter(item => selectedIds.has(item.id))
    },
    scrollToTop: () => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
    },
  }))

  const handlePress = useCallback((item: LocalMusicInfo, index: number) => {
    if (isMultiSelectMode) {
      setSelectedIds(prev => {
        const newSet = new Set(prev)
        if (selectMode === 'range' && lastSelectedIndexRef.current >= 0) {
          const start = Math.min(lastSelectedIndexRef.current, index)
          const end = Math.max(lastSelectedIndexRef.current, index)
          for (let i = start; i <= end; i++) {
            newSet.add(list[i].id)
          }
        } else {
          if (newSet.has(item.id)) {
            newSet.delete(item.id)
          } else {
            newSet.add(item.id)
          }
        }
        lastSelectedIndexRef.current = index
        onSelectAll(newSet.size === list.length)
        return newSet
      })
    } else {
      // Single click to play
      onPlay(index)
    }
  }, [isMultiSelectMode, selectMode, list, onSelectAll, onPlay])

  const handleLongPress = useCallback((item: LocalMusicInfo, index: number, position: { x: number, y: number, w: number, h: number }) => {
    if (!isMultiSelectMode) {
      onMultiSelectMode()
      setSelectedIds(new Set([item.id]))
      lastSelectedIndexRef.current = index
    } else {
      onShowMenu(item, index, position)
    }
  }, [isMultiSelectMode, onMultiSelectMode, onShowMenu])

  const handleShowMenu = useCallback((item: LocalMusicInfo, index: number, position: { x: number, y: number, w: number, h: number }) => {
    onShowMenu(item, index, position)
  }, [onShowMenu])

  const playMusicInfo = usePlayMusicInfo()
  const playingMusicId = playMusicInfo.musicInfo?.id ?? null

  const renderItem = useCallback(({ item, index }: { item: LocalMusicInfo, index: number }) => {
    return (
      <ListItem
        item={item}
        index={index}
        isMultiSelectMode={isMultiSelectMode}
        isSelected={selectedIds.has(item.id)}
        isPlaying={item.id === playingMusicId}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onShowMenu={handleShowMenu}
      />
    )
  }, [isMultiSelectMode, selectedIds, playingMusicId, handlePress, handleLongPress, handleShowMenu])

  const keyExtractor = useCallback((item: LocalMusicInfo) => item.id, [])

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), [])

  const ListEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Text size={14} color={theme['c-font-label']}>{t('local_no_music')}</Text>
    </View>
  ), [theme, t])

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={list}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        ListEmptyComponent={ListEmptyComponent}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
      />
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
})
