/**
 * 帮助提示组件
 * 点击问号图标显示帮助信息弹窗
 */

import { memo, useRef } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'

export interface HelpTipProps {
  /**
   * 帮助文本内容
   */
  content: string
  /**
   * 图标大小
   */
  iconSize?: number
}

export default memo(({ content, iconSize = 16 }: HelpTipProps) => {
  const theme = useTheme()
  const t = useI18n()
  const alertRef = useRef<ConfirmAlertType>(null)

  const handleOpen = () => {
    alertRef.current?.setVisible(true)
  }

  return (
    <>
      <TouchableOpacity
        onPress={handleOpen}
        style={styles.iconWrapper}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="help" size={iconSize} color={theme['c-font-label']} />
      </TouchableOpacity>

      <ConfirmAlert
        ref={alertRef}
        text={content}
        confirmText={`${t('dialog_button_confirm') || '已了解'} 👌`}
        showConfirm={true}
        onConfirm={() => {
          alertRef.current?.setVisible(false)
        }}
      />
    </>
  )
})

const styles = createStyle({
  iconWrapper: {
    marginLeft: 8,
  },
})

