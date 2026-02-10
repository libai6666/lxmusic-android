import { localAction, type LocalMusicInfo } from '@/store/local'
import { scanAudioFiles, readMetadata, type MusicMetadata } from '@/utils/localMediaMetadata'
import { toast, confirmDialog } from '@/utils/tools'
import { selectManagedFolder, stat, readDir, externalStorageDirectoryPath, getExternalStoragePaths } from '@/utils/fs'
import { isExternalStorageManager, requestManageExternalStorage } from '@/utils/nativeModules/utils'

const generateLocalMusicId = (filePath: string): string => {
  // Use a simple hash function to generate unique ID from file path
  let hash = 0
  for (let i = 0; i < filePath.length; i++) {
    const char = filePath.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return 'local_' + Math.abs(hash).toString(36) + '_' + filePath.length
}

const createLocalMusicInfo = async(filePath: string, metadata: MusicMetadata | null, fileSize: number): Promise<LocalMusicInfo> => {
  const fileName = filePath.split(/[/\\]/).pop() || ''
  const ext = fileName.split('.').pop() || ''
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '')

  let name = nameWithoutExt
  let singer = ''
  let albumName = ''
  let interval: string | null = null

  if (metadata) {
    name = metadata.name || nameWithoutExt
    singer = metadata.singer || ''
    albumName = metadata.albumName || ''
    if (metadata.interval) {
      const minutes = Math.floor(metadata.interval / 60)
      const seconds = Math.floor(metadata.interval % 60)
      interval = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
  } else {
    // Try to parse name and singer from filename (format: "singer - name" or "name - singer")
    if (nameWithoutExt.includes(' - ')) {
      const parts = nameWithoutExt.split(' - ')
      if (parts.length >= 2) {
        singer = parts[0].trim()
        name = parts.slice(1).join(' - ').trim()
      }
    }
  }

  return {
    id: generateLocalMusicId(filePath),
    name,
    singer,
    source: 'local',
    interval,
    meta: {
      songId: filePath,
      albumName,
      filePath,
      ext,
    },
    addTime: Date.now(),
    size: fileSize,
  }
}

// Collect all audio files recursively
const collectAudioFiles = async(folderPath: string, allFiles: Array<{ path: string; name: string }>, depth: number = 0): Promise<void> => {
  try {
    const items = await readDir(folderPath)
    for (const item of items) {
      const itemPath = item.path || (folderPath + '/' + item.name)
      // Use isDirectory property from react-native-file-system
      if (item.isDirectory) {
        // Skip hidden and system folders
        if (item.name.startsWith('.') || item.name === 'Android') continue
        await collectAudioFiles(itemPath, allFiles, depth + 1)
      } else if (item.isFile) {
        const ext = (item.name || '').split('.').pop()?.toLowerCase() || ''
        const isAudio = item.mimeType?.startsWith('audio/') || ['mp3', 'flac', 'ogg', 'wav', 'm4a', 'aac'].includes(ext)
        if (isAudio) {
          allFiles.push({ path: itemPath, name: item.name || '' })
        }
      }
    }
  } catch (e) {
    // Ignore errors for inaccessible folders
  }
}

export const scanFolderFiles = async(folderPath: string, recursive: boolean = false): Promise<LocalMusicInfo[]> => {
  const results: LocalMusicInfo[] = []

  try {
    let filesToProcess: Array<{ path: string; name: string }> = []

    if (recursive) {
      // Recursive scan for all storage
      await collectAudioFiles(folderPath, filesToProcess)
    } else {
      // Non-recursive scan for specific folder
      const files = await scanAudioFiles(folderPath)
      filesToProcess = files.map(f => ({ path: f.path || (folderPath + '/' + f.name), name: f.name || '' }))
    }

    const total = filesToProcess.length
    localAction.updateScanProgress({ current: 0, total, currentFile: '' })

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i]

      localAction.updateScanProgress({
        current: i + 1,
        total,
        currentFile: file.name,
      })

      try {
        const fileInfo = await stat(file.path).catch(() => null)
        const fileSize = fileInfo?.size || 0

        let metadata: MusicMetadata | null = null
        try {
          metadata = await readMetadata(file.path)
        } catch (e) {
          // Ignore metadata read errors
        }

        const musicInfo = await createLocalMusicInfo(file.path, metadata, fileSize)
        results.push(musicInfo)
      } catch (e) {
        console.error('Error processing file:', file.path, e)
      }
    }
  } catch (e) {
    console.error('Error scanning folder:', folderPath, e)
  }

  return results
}

export const selectAndImportFolder = async(): Promise<void> => {
  try {
    const result = await selectManagedFolder(true)
    if (!result || !result.path) return

    const folderPath = result.path
    const folderName = folderPath.split(/[/\\]/).pop() || folderPath

    // Add folder to list
    const added = localAction.addFolder({
      path: folderPath,
      name: folderName,
      addTime: Date.now(),
    })

    // folder already exists is ok, still proceed to scan for missing songs

    // Start scanning
    localAction.setScanning(true)

    try {
      const musics = await scanFolderFiles(folderPath)

      if (musics.length === 0) {
        toast(global.i18n.t('local_scan_empty'))
      } else {
        const addedCount = localAction.addMusics(musics, true)
        toast(global.i18n.t('local_scan_complete', { count: addedCount }))
      }
    } finally {
      localAction.setScanning(false)
      localAction.updateScanProgress({ current: 0, total: 0, currentFile: '' })
    }
  } catch (e) {
    console.error('Error selecting folder:', e)
    localAction.setScanning(false)
  }
}

export const scanFolder = async(): Promise<void> => {
  const folders = localAction.getFolders()
  if (folders.length === 0) {
    toast(global.i18n.t('local_folder_empty'))
    return
  }

  localAction.setScanning(true)

  try {
    let totalAdded = 0

    for (const folder of folders) {
      try {
        const musics = await scanFolderFiles(folder.path)
        totalAdded += localAction.addMusics(musics)
      } catch (e) {
        console.error('Error scanning folder:', folder.path, e)
      }
    }

    if (totalAdded === 0) {
      toast(global.i18n.t('local_scan_empty'))
    } else {
      toast(global.i18n.t('local_scan_complete', { count: totalAdded }))
    }
  } finally {
    localAction.setScanning(false)
    localAction.updateScanProgress({ current: 0, total: 0, currentFile: '' })
  }
}

export const scanAllStorage = async(): Promise<void> => {
  // 检查是否有所有文件访问权限 (Android 11+)
  const hasPermission = await isExternalStorageManager()
  if (!hasPermission) {
    const grantPermission = await confirmDialog({
      message: global.i18n.t('local_storage_permission_tip'),
      confirmButtonText: global.i18n.t('local_storage_permission_grant'),
      cancelButtonText: global.i18n.t('cancel'),
    })
    if (grantPermission) {
      const granted = await requestManageExternalStorage()
      if (!granted) {
        toast(global.i18n.t('local_storage_permission_denied'))
        return
      }
      // 用户授权后需要重新检查
      const recheckPermission = await isExternalStorageManager()
      if (!recheckPermission) {
        toast(global.i18n.t('local_storage_permission_denied'))
        return
      }
    } else {
      return
    }
  }

  const confirmed = await confirmDialog({
    message: global.i18n.t('local_scan_all_tip'),
    confirmButtonText: global.i18n.t('local_scan_all_confirm'),
  })

  if (!confirmed) return

  localAction.setScanning(true)

  try {
    let totalAdded = 0
    const scannedPaths: string[] = []

    // Scan internal storage (recursive)
    if (externalStorageDirectoryPath) {
      try {
        const musics = await scanFolderFiles(externalStorageDirectoryPath, true)
        totalAdded += localAction.addMusics(musics, true)
        scannedPaths.push(externalStorageDirectoryPath)
      } catch (e) {
        console.error('Error scanning internal storage:', e)
      }
    }

    // Scan external SD cards (recursive)
    try {
      const externalPaths = await getExternalStoragePaths(true)
      for (const extPath of externalPaths) {
        if (scannedPaths.includes(extPath)) continue
        try {
          const musics = await scanFolderFiles(extPath, true)
          totalAdded += localAction.addMusics(musics, true)
          scannedPaths.push(extPath)
        } catch (e) {
          console.error('Error scanning external storage:', extPath, e)
        }
      }
    } catch (e) {
      console.error('Error getting external storage paths:', e)
    }

    if (totalAdded === 0) {
      toast(global.i18n.t('local_scan_empty'))
    } else {
      toast(global.i18n.t('local_scan_complete', { count: totalAdded }))
    }
  } finally {
    localAction.setScanning(false)
    localAction.updateScanProgress({ current: 0, total: 0, currentFile: '' })
  }
}
