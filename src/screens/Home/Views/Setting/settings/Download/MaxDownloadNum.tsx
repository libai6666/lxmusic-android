import { memo, useState, useCallback } from 'react'
import { View } from 'react-native'

import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import Slider from '../../components/Slider'
import SubTitle from '../../components/SubTitle'
import HelpTip from '../../components/HelpTip'

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const maxDownloadNum = useSettingValue('download.maxDownloadNum')
  const [sliderValue, setSliderValue] = useState(maxDownloadNum)

  const handleSlidingStart = useCallback(() => {
    setSliderValue(maxDownloadNum)
  }, [maxDownloadNum])

  const handleValueChange = useCallback((value: number) => {
    setSliderValue(Math.round(value))
  }, [])

  const handleSlidingComplete = useCallback((value: number) => {
    const newValue = Math.round(value)
    setSliderValue(newValue)
    if (newValue !== maxDownloadNum) {
      updateSetting({ 'download.maxDownloadNum': newValue })
    }
  }, [maxDownloadNum])

  return (
    <SubTitle title={t('download_config_max_download_num')}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text color={theme['c-font']}>{sliderValue}</Text>
          <HelpTip content={t('download_config_max_download_num_tip')} />
        </View>
        <Slider
          value={sliderValue}
          onSlidingStart={handleSlidingStart}
          onValueChange={handleValueChange}
          onSlidingComplete={handleSlidingComplete}
          minimumValue={1}
          maximumValue={6}
          step={1}
        />
      </View>
    </SubTitle>
  )
})

const styles = createStyle({
  content: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
})

