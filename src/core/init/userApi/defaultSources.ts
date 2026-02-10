import defaultMusicSources, { DEFAULT_SOURCES_VERSION } from '@/config/defaultMusicSources'
import { importUserApi, removeUserApi } from '@/core/userApi'
import { setApiSource } from '@/core/apiSource'
import { getUserApiList, getDefaultSourcesVersion, saveDefaultSourcesVersion } from '@/utils/data'
import { log } from '@/utils/log'

/**
 * 从 URL 获取脚本内容
 */
const fetchScript = async(url: string): Promise<string> => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache',
    },
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch script from ${url}: ${response.status}`)
  }
  return response.text()
}

/**
 * 导入所有默认音乐源并选中第一个
 */
const importAllDefaultSources = async(): Promise<void> => {
  let firstApiId: string | null = null

  for (let i = 0; i < defaultMusicSources.length; i++) {
    const source = defaultMusicSources[i]
    try {
      log.info(`[DefaultSources] Fetching source from: ${source.url}`)
      const script = await fetchScript(source.url)

      await importUserApi(script)
      log.info(`[DefaultSources] Successfully imported: ${source.name}`)

      // 记录第一个成功导入的音乐源 ID
      if (firstApiId === null) {
        const apis = await getUserApiList()
        if (apis.length > 0) {
          firstApiId = apis[apis.length - 1].id
        }
      }
    } catch (error: any) {
      log.error(`[DefaultSources] Failed to import ${source.name}: ${error.message}`)
    }
  }

  // 选中第一个成功导入的音乐源
  if (firstApiId) {
    log.info(`[DefaultSources] Setting default source: ${firstApiId}`)
    setApiSource(firstApiId)
  }

  // 保存当前默认源版本号
  await saveDefaultSourcesVersion(DEFAULT_SOURCES_VERSION)
}

/**
 * 初始化默认音乐源
 * - 全新安装：直接导入所有默认源并选中第一个
 * - 版本升级（默认源配置有变化）：清除旧的默认源，重新导入
 */
export const initDefaultMusicSources = async(): Promise<void> => {
  try {
    const storedVersion = await getDefaultSourcesVersion()
    const existingApis = await getUserApiList()

    if (storedVersion >= DEFAULT_SOURCES_VERSION && existingApis.length > 0) {
      log.info('[DefaultSources] Default sources are up to date, skipping')
      return
    }

    if (existingApis.length > 0 && storedVersion < DEFAULT_SOURCES_VERSION) {
      // 版本升级：清除旧的默认源，然后重新导入
      log.info(`[DefaultSources] Upgrading default sources: v${storedVersion} -> v${DEFAULT_SOURCES_VERSION}`)
      try {
        await removeUserApi(existingApis.map(api => api.id))
        log.info(`[DefaultSources] Removed ${existingApis.length} old sources`)
      } catch (e: any) {
        log.error(`[DefaultSources] Failed to remove old sources: ${e.message}`)
      }
    } else {
      log.info('[DefaultSources] No music sources found, importing default sources...')
    }

    await importAllDefaultSources()
  } catch (error: any) {
    log.error(`[DefaultSources] Initialization failed: ${error.message}`)
  }
}
