import { memo, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'

import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import SubTitle from '../../components/SubTitle'

const FILE_NAME_OPTIONS: Array<{ value: LX.AppSetting['download.fileName'], label: string }> = [
  { value: '歌名 - 歌手', label: 'download_config_file_name_1' },
  { value: '歌手 - 歌名', label: 'download_config_file_name_2' },
  { value: '歌名', label: 'download_config_file_name_3' },
]

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const fileName = useSettingValue('download.fileName')

  const handleChange = useCallback((value: LX.AppSetting['download.fileName']) => {
    if (value !== fileName) {
      updateSetting({ 'download.fileName': value })
    }
  }, [fileName])

  return (
    <SubTitle title={t('download_config_file_name')}>
      <View style={styles.content}>
        {FILE_NAME_OPTIONS.map((option) => {
          const isSelected = fileName === option.value
          return (
            <TouchableOpacity
              key={option.value}
              style={{
                ...styles.option,
                backgroundColor: isSelected ? theme['c-primary-background-active'] : 'transparent',
              }}
              onPress={() => handleChange(option.value)}
            >
              <View style={styles.optionContent}>
                <Icon
                  name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={18}
                  color={isSelected ? theme['c-primary-font'] : theme['c-font']}
                />
                <Text
                  style={styles.optionText}
                  color={isSelected ? theme['c-primary-font'] : theme['c-font']}
                >
                  {t(option.label)}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </SubTitle>
  )
})

const styles = createStyle({
  content: {
    flexGrow: 0,
    flexShrink: 1,
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    marginLeft: 10,
  },
})

