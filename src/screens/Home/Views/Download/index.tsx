import { useRef } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { useDownloadStats } from '@/store/download'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import List from './List'
import ListMenu, { type ListMenuType, type SelectInfo } from './ListMenu'
import { startTask, pauseTask, resumeTask, retryTask, cancelTask, pauseAllTasks, startAllTasks } from '@/core/download'
import { downloadAction } from '@/store/download'
import { confirmDialog, toast } from '@/utils/tools'

export default () => {
  const theme = useTheme()
  const t = useI18n()
  const stats = useDownloadStats()
  const listMenuRef = useRef<ListMenuType>(null)

  const handleShowMenu = (selectInfo: SelectInfo, position: { x: number, y: number, w: number, h: number }) => {
    listMenuRef.current?.show(selectInfo, position)
  }

  const handleStart = async(selectInfo: SelectInfo) => {
    await startTask(selectInfo.item.id)
  }

  const handlePause = (selectInfo: SelectInfo) => {
    pauseTask(selectInfo.item.id)
  }

  const handleResume = async(selectInfo: SelectInfo) => {
    await resumeTask(selectInfo.item.id)
  }

  const handleRetry = async(selectInfo: SelectInfo) => {
    await retryTask(selectInfo.item.id)
  }

  const handleCancel = (selectInfo: SelectInfo) => {
    cancelTask(selectInfo.item.id)
  }

  const handleRemove = async(selectInfo: SelectInfo) => {
    const confirmed = await confirmDialog({
      message: t('download_remove_task_tip', { name: selectInfo.item.metadata.musicInfo.name }),
      cancelButtonText: t('cancel'),
      confirmButtonText: t('confirm'),
    })
    if (confirmed) {
      downloadAction.removeTask(selectInfo.item.id)
      toast(t('list_edit_action_tip_remove_success'))
    }
  }

  const handlePauseAll = () => {
    pauseAllTasks()
  }

  const handleStartAll = () => {
    startAllTasks()
  }

  const handleClearCompleted = async() => {
    const confirmed = await confirmDialog({
      message: t('download_clear_completed_tip'),
      cancelButtonText: t('cancel'),
      confirmButtonText: t('confirm'),
    })
    if (confirmed) {
      downloadAction.clearCompleted()
    }
  }

  return (
    <View style={styles.container}>
      <View style={{ ...styles.header, backgroundColor: theme['c-primary-background'] }}>
        <View style={styles.statsContainer}>
          <Text size={12} color={theme['c-font']}>
            {t('download_status_run')}: {stats.running} / {t('download_status_waiting')}: {stats.waiting} / {t('download_status_completed')}: {stats.completed}
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          {stats.running > 0 && (
            <TouchableOpacity onPress={handlePauseAll} style={styles.button}>
              <Icon name="pause" size={14} color={theme['c-primary-font']} />
              <Text size={12} color={theme['c-primary-font']} style={styles.buttonText}>{t('download_btn_pause_all')}</Text>
            </TouchableOpacity>
          )}
          {(stats.waiting > 0 || stats.paused > 0) && (
            <TouchableOpacity onPress={handleStartAll} style={styles.button}>
              <Icon name="play" size={14} color={theme['c-primary-font']} />
              <Text size={12} color={theme['c-primary-font']} style={styles.buttonText}>{t('download_btn_start_all')}</Text>
            </TouchableOpacity>
          )}
          {stats.completed > 0 && (
            <TouchableOpacity onPress={handleClearCompleted} style={styles.button}>
              <Icon name="remove" size={14} color={theme['c-primary-font']} />
              <Text size={12} color={theme['c-primary-font']} style={styles.buttonText}>{t('download_clear_completed')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <List onShowMenu={handleShowMenu} />
      <ListMenu
        ref={listMenuRef}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onRetry={handleRetry}
        onCancel={handleCancel}
        onRemove={handleRemove}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statsContainer: {
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  buttonText: {
    marginLeft: 5,
  },
})

