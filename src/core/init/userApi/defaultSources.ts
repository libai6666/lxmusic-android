import defaultMusicSources from '@/config/defaultMusicSources'
import { importUserApi } from '@/core/userApi'
import { setApiSource } from '@/core/apiSource'
import { getUserApiList } from '@/utils/data'
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
 * 初始化默认音乐源
 * 如果用户没有任何音乐源，自动从预设 URL 导入并选中第一个
 */
export const initDefaultMusicSources = async(): Promise<void> => {
  try {
    const existingApis = await getUserApiList()

    // 如果已有音乐源，跳过初始化
    if (existingApis.length > 0) {
      log.info('[DefaultSources] User already has music sources, skipping initialization')
      return
    }

    log.info('[DefaultSources] No music sources found, importing default sources...')

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
  } catch (error: any) {
    log.error(`[DefaultSources] Initialization failed: ${error.message}`)
  }
}
