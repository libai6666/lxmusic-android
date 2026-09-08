import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { type NativeScrollEvent, type NativeSyntheticEvent, View, TouchableOpacity, Animated } from 'react-native'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { type Lines } from 'lrc-file-parser'
import { useTheme } from '@/store/theme/hook'
import { formatPlayTime2 } from '@/utils'
import { Icon } from '@/components/common/Icon'


export interface PlayLineType {
  updateScrollInfo: (scrollInfo: NativeSyntheticEvent<NativeScrollEvent>['nativeEvent'] | null) => void
  updateLayoutInfo: (listLayoutInfo: { spaceHeight: number, lineHeights: number[] }) => void
  updateLyricLines: (lyricLines: Lines) => void
  setVisible: (visible: boolean) => void
}

export interface PlayLineProps {
  onPlayLine: (time: number) => void
}

const ANIMATION_DURATION = 300
const ANCHOR_RATIO = 0.4

export default forwardRef<PlayLineType, PlayLineProps>(({ onPlayLine }, ref) => {
  const theme = useTheme()
  const [scrollInfo, setScrollInfo] = useState<NativeSyntheticEvent<NativeScrollEvent>['nativeEvent'] | null>(null)
  const [listLayoutInfo, setListLayoutInfo] = useState<{ spaceHeight: number, lineHeights: number[] }>({ spaceHeight: 0, lineHeights: [] })
  const [lyricLines, setLyricLines] = useState<Lines>([])
  const [visible, setVisible] = useState(false)
  const opsAnim = useRef<Animated.Value>(
    new Animated.Value(0),
  ).current

  const setShow = (visible: boolean) => {
    Animated.timing(opsAnim, {
      toValue: visible ? 1 : 0,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start(() => {
      if (!visible) setVisible(false)
    })
  }

  useImperativeHandle(ref, () => ({
    updateScrollInfo(scrollInfo) {
      setScrollInfo(scrollInfo)
    },
    updateLayoutInfo(listLayoutInfo) {
      setListLayoutInfo(listLayoutInfo)
    },
    updateLyricLines(lyricLines) {
      setLyricLines(lyricLines)
    },
    setVisible(visible) {
      if (visible) {
        setVisible(true)
      }
      requestAnimationFrame(() => {
        setShow(visible)
      })
    },
  }))

  const handlePlayLine = () => {
    onPlayLine(time / 1000)
  }

  if (!scrollInfo || !visible || !lyricLines.length) return null
  const viewHeight = scrollInfo.layoutMeasurement.height
  const anchor = scrollInfo.contentOffset.y + viewHeight * ANCHOR_RATIO
  let lineTop = listLayoutInfo.spaceHeight
  let lineHeight = 0
  let targetLineNum = -1
  for (let line = 0; line < listLayoutInfo.lineHeights.length; line++) {
    lineHeight = listLayoutInfo.lineHeights[line] ?? 0
    if (lineTop + lineHeight < anchor) {
      lineTop += lineHeight
      continue
    }
    targetLineNum = line
    break
  }
  if (targetLineNum == -1) {
    targetLineNum = listLayoutInfo.lineHeights.length - 1
    lineTop -= lineHeight
  }
  if (targetLineNum < 0) return null
  const time = lyricLines[targetLineNum]?.time ?? 0
  const timeLabel = formatPlayTime2(time / 1000)
  const top = Math.min(Math.max(lineTop - scrollInfo.contentOffset.y, 0), Math.max(viewHeight - lineHeight, 0))
  return (
    <Animated.View style={{ ...styles.playLine, top, height: lineHeight, opacity: opsAnim }} pointerEvents="box-none">
      <View style={{ ...styles.band, backgroundColor: theme['c-primary-light-400-alpha-900'] }} pointerEvents="none" />
      <Text style={styles.label} color={theme['c-primary-font']} size={12}>{timeLabel}</Text>
      <TouchableOpacity style={styles.button} onPress={handlePlayLine}>
        <Icon name="play" color={theme['c-primary-font']} size={18} />
      </TouchableOpacity>
    </Animated.View>
  )
})

const styles = createStyle({
  playLine: {
    position: 'absolute',
    width: '100%',
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  band: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 0,
    bottom: 0,
    borderRadius: 6,
  },
  label: {
    paddingLeft: 14,
    minWidth: 50,
  },
  button: {
    paddingLeft: 12,
    paddingRight: 14,
    height: '100%',
    justifyContent: 'center',
  },
})
