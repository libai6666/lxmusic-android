import { useMemo, useRef, useImperativeHandle, forwardRef, useState } from 'react'
import { useI18n } from '@/lang'
import Menu, { type MenuType, type Position } from '@/components/common/Menu'

export interface SelectInfo {
  item: LX.Download.ListItem
  index: number
}
const initSelectInfo = {} as SelectInfo

export interface ListMenuProps {
  onStart: (selectInfo: SelectInfo) => void
  onPause: (selectInfo: SelectInfo) => void
  onResume: (selectInfo: SelectInfo) => void
  onRetry: (selectInfo: SelectInfo) => void
  onCancel: (selectInfo: SelectInfo) => void
  onRemove: (selectInfo: SelectInfo) => void
}

export interface ListMenuType {
  show: (selectInfo: SelectInfo, position: Position) => void
}

export type {
  Position,
}

export default forwardRef<ListMenuType, ListMenuProps>((props: ListMenuProps, ref) => {
  const t = useI18n()
  const [visible, setVisible] = useState(false)
  const menuRef = useRef<MenuType>(null)
  const selectInfoRef = useRef<SelectInfo>(initSelectInfo)

  useImperativeHandle(ref, () => ({
    show(selectInfo, position) {
      selectInfoRef.current = selectInfo
      if (visible) menuRef.current?.show(position)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          menuRef.current?.show(position)
        })
      }
    },
  }))

  const menus = useMemo(() => {
    const item = selectInfoRef.current.item
    if (!item) return []

    const menuItems: Array<{ action: string, label: string }> = []

    switch (item.status) {
      case 'waiting':
        menuItems.push({ action: 'start', label: t('download_btn_start') })
        menuItems.push({ action: 'cancel', label: t('download_btn_cancel') })
        break
      case 'run':
        menuItems.push({ action: 'pause', label: t('download_btn_pause') })
        break
      case 'pause':
        menuItems.push({ action: 'resume', label: t('download_btn_resume') })
        menuItems.push({ action: 'remove', label: t('download_remove_task') })
        break
      case 'error':
        menuItems.push({ action: 'retry', label: t('download_btn_retry') })
        menuItems.push({ action: 'remove', label: t('download_remove_task') })
        break
      case 'completed':
        menuItems.push({ action: 'remove', label: t('download_remove_task') })
        break
    }

    return menuItems
  }, [t, selectInfoRef.current.item])

  const handleMenuPress = ({ action }: { action: string }) => {
    const selectInfo = selectInfoRef.current
    switch (action) {
      case 'start':
        props.onStart(selectInfo)
        break
      case 'pause':
        props.onPause(selectInfo)
        break
      case 'resume':
        props.onResume(selectInfo)
        break
      case 'retry':
        props.onRetry(selectInfo)
        break
      case 'cancel':
        props.onCancel(selectInfo)
        break
      case 'remove':
        props.onRemove(selectInfo)
        break
    }
  }

  return (
    visible
      ? <Menu ref={menuRef} menus={menus} onPress={handleMenuPress} />
      : null
  )
})

