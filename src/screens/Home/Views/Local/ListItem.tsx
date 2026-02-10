import { memo, useCallback, useRef } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { type LocalMusicInfo } from '@/store/local/state'

export const ITEM_HEIGHT = 56

interface Props {
  item: LocalMusicInfo
  index: number
  isMultiSelectMode: boolean
  isSelected: boolean
  isPlaying?: boolean
  onPress: (item: LocalMusicInfo, index: number) => void
  onLongPress: (item: LocalMusicInfo, index: number, position: { x: number, y: number, w: number, h: number }) => void
  onShowMenu: (item: LocalMusicInfo, index: number, position: { x: number, y: number, w: number, h: number }) => void
}

export default memo(({ item, index, isMultiSelectMode, isSelected, isPlaying, onPress, onLongPress, onShowMenu }: Props) => {
  const theme = useTheme()
  const viewRef = useRef<View>(null)

  const getPosition = useCallback((): Promise<{ x: number, y: number, w: number, h: number }> => {
    return new Promise((resolve) => {
      viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
        resolve({ x: pageX, y: pageY, w: width, h: height })
      })
    })
  }, [])

  const handlePress = useCallback(() => {
    if (isMultiSelectMode) {
      onPress(item, index)
    } else {
      onPress(item, index)
    }
  }, [item, index, isMultiSelectMode, onPress])

  const handleLongPress = useCallback(async() => {
    const position = await getPosition()
    onLongPress(item, index, position)
  }, [item, index, onLongPress, getPosition])

  const handleShowMenu = useCallback(async() => {
    const position = await getPosition()
    onShowMenu(item, index, position)
  }, [item, index, onShowMenu, getPosition])

  return (
    <View ref={viewRef} style={[styles.container, { backgroundColor: isSelected ? theme['c-primary-light-400-alpha-200'] : 'transparent' }]}>
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.5}
      >
        {isMultiSelectMode && (
          <View style={styles.checkbox}>
            <Icon
              name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={20}
              color={isSelected ? theme['c-primary-font'] : theme['c-font-label']}
            />
          </View>
        )}
        {!isMultiSelectMode && isPlaying && (
          <View style={styles.playingIcon}>
            <Icon name="play-outline" size={16} color={theme['c-primary-font']} />
          </View>
        )}
        <View style={styles.info}>
          <Text numberOfLines={1} size={15} color={isPlaying ? theme['c-primary-font'] : theme['c-font']}>
            {item.name}
          </Text>
          <View style={styles.subInfo}>
            <Text numberOfLines={1} size={12} color={isPlaying ? theme['c-primary-alpha-200'] : theme['c-font-label']}>
              {item.singer}
            </Text>
            {item.meta.albumName ? (
              <Text numberOfLines={1} size={12} color={isPlaying ? theme['c-primary-alpha-200'] : theme['c-font-label']} style={styles.album}>
                {' - '}{item.meta.albumName}
              </Text>
            ) : null}
            {item.interval ? (
              <Text size={12} color={isPlaying ? theme['c-primary-alpha-400'] : theme['c-font-label']} style={styles.duration}>
                {item.interval}
              </Text>
            ) : null}
          </View>
        </View>
        <TouchableOpacity style={styles.moreBtn} onPress={handleShowMenu}>
          <Icon name="dots-vertical" size={20} color={theme['c-font-label']} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  checkbox: {
    marginRight: 10,
  },
  playingIcon: {
    marginRight: 8,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  subInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  album: {
    flex: 1,
  },
  duration: {
    marginLeft: 10,
  },
  moreBtn: {
    padding: 10,
  },
})
