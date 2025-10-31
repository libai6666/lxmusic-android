import { memo, useRef } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { LIST_ITEM_HEIGHT } from '@/config/constant'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import Text from '@/components/common/Text'
import Badge from '@/components/common/Badge'
import { useI18n } from '@/lang'

export const ITEM_HEIGHT = scaleSizeH(LIST_ITEM_HEIGHT)

export default memo(({ item, index, onShowMenu }: {
  item: LX.Download.ListItem
  index: number
  onShowMenu: (item: LX.Download.ListItem, index: number, position: { x: number, y: number, w: number, h: number }) => void
}) => {
  const theme = useTheme()
  const t = useI18n()
  const moreButtonRef = useRef<TouchableOpacity>(null)

  const handleShowMenu = () => {
    if (moreButtonRef.current?.measure) {
      moreButtonRef.current.measure((fx, fy, width, height, px, py) => {
        onShowMenu(item, index, { x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
      })
    }
  }

  // 获取状态文本
  const getStatusText = () => {
    switch (item.status) {
      case 'run':
        return t('download_status_run')
      case 'waiting':
        return t('download_status_waiting')
      case 'pause':
        return t('download_status_pause')
      case 'error':
        return t('download_status_error')
      case 'completed':
        return t('download_status_completed')
      default:
        return item.statusText
    }
  }

  // 获取状态颜色
  const getStatusColor = () => {
    switch (item.status) {
      case 'run':
        return theme['c-primary-font']
      case 'error':
        return '#ff4444'
      case 'completed':
        return '#00cc66'
      default:
        return theme['c-300']
    }
  }

  const musicInfo = item.metadata.musicInfo

  return (
    <View style={{ ...styles.listItem, height: ITEM_HEIGHT, backgroundColor: 'rgba(0,0,0,0)' }}>
      <View style={styles.listItemLeft}>
        <Text style={styles.sn} size={13} color={theme['c-300']}>{index + 1}</Text>
        <View style={styles.itemInfo}>
          <Text color={theme['c-font']} numberOfLines={1}>{musicInfo.name}</Text>
          <View style={styles.listItemSingle}>
            <Badge>{musicInfo.source.toUpperCase()}</Badge>
            <Text style={styles.listItemSingleText} size={11} color={theme['c-500']} numberOfLines={1}>
              {musicInfo.singer}
            </Text>
          </View>
        </View>
        <View style={styles.statusInfo}>
          <Text size={11} color={getStatusColor()} numberOfLines={1}>
            {getStatusText()}
          </Text>
          {item.status === 'run' && (
            <Text size={11} color={theme['c-300']} numberOfLines={1}>
              {`${(item.progress * 100).toFixed(0)}% · ${item.speed}`}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={handleShowMenu} ref={moreButtonRef} style={styles.moreButton}>
        <Icon name="dots-vertical" style={{ color: theme['c-350'] }} size={12} />
      </TouchableOpacity>
    </View>
  )
})

const styles = createStyle({
  listItem: {
    flexDirection: 'row',
    paddingLeft: 5,
    paddingRight: 5,
    alignItems: 'center',
  },
  listItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sn: {
    width: 38,
    paddingLeft: 3,
    textAlign: 'center',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  listItemSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  listItemSingleText: {
    marginLeft: 5,
    flex: 1,
  },
  statusInfo: {
    width: 120,
    alignItems: 'flex-end',
    paddingRight: 5,
  },
  moreButton: {
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
})

