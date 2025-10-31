import { useRef, useCallback } from 'react'
import { FlatList, View } from 'react-native'
import { useDownloadList } from '@/store/download'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import ListItem, { ITEM_HEIGHT } from './ListItem'

export default ({ onShowMenu }: {
  onShowMenu: (selectInfo: { item: LX.Download.ListItem, index: number }, position: { x: number, y: number, w: number, h: number }) => void
}) => {
  const theme = useTheme()
  const t = useI18n()
  const list = useDownloadList()
  const flatListRef = useRef<FlatList>(null)

  const renderItem = useCallback(({ item, index }: { item: LX.Download.ListItem, index: number }) => {
    return (
      <ListItem
        item={item}
        index={index}
        onShowMenu={(item, index, position) => {
          onShowMenu({ item, index }, position)
        }}
      />
    )
  }, [onShowMenu])

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), [])

  const keyExtractor = useCallback((item: LX.Download.ListItem) => item.id, [])

  if (list.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text color={theme['c-300']} size={14}>{t('download_empty')}</Text>
      </View>
    )
  }

  return (
    <FlatList
      ref={flatListRef}
      data={list}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      keyExtractor={keyExtractor}
      removeClippedSubviews={true}
      maxToRenderPerBatch={20}
      updateCellsBatchingPeriod={50}
      initialNumToRender={20}
      windowSize={21}
    />
  )
}

