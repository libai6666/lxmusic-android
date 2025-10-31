import { memo } from 'react'
import { View } from 'react-native'

import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import CheckBoxItem from '../../components/CheckBoxItem'
import HelpTip from '../../components/HelpTip'

export default memo(() => {
  const t = useI18n()
  const autoSwitchSource = useSettingValue('download.autoSwitchSource')

  const handleChange = (value: boolean) => {
    updateSetting({ 'download.autoSwitchSource': value })
  }

  return (
    <CheckBoxItem
      check={autoSwitchSource}
      onChange={handleChange}
      label={
        <View style={styles.labelContainer}>
          <Text>{t('download_config_auto_switch_source')}</Text>
          <HelpTip content={t('download_config_auto_switch_source_tip')} />
        </View>
      }
    />
  )
})

const styles = createStyle({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})

