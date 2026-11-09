import { httpGet } from '@/utils/request'
import { downloadFile, stopDownload, temporaryDirectoryPath, unlink, existsFile } from '@/utils/fs'
import { getSupportedAbis, installApk } from '@/utils/nativeModules/utils'
import { APP_PROVIDER_NAME } from '@/config/constant'

/**
 * 公开分发仓：GitHub Actions 发版时把 APK 发布到该仓库的 Release，
 * 并把更新清单 latest-android.json 写到仓库根目录（main 分支）。
 */
export const UPDATE_REPO = 'libai6666/lxmusic-android-updates'
export const UPDATE_RELEASES_PAGE = `https://github.com/${UPDATE_REPO}/releases`
const MANIFEST_RAW_URL = `https://raw.githubusercontent.com/${UPDATE_REPO}/main/latest-android.json`

/**
 * 公共 GitHub 加速代理：国内网络直连 raw/release 很慢甚至不通，
 * 检查与下载时优先走代理，最后直连兜底。代理服务兴衰无常，随版本维护。
 */
const GITHUB_MIRRORS = [
  'https://ghfast.top/',
  'https://gh-proxy.net/',
  'https://gh-proxy.com/',
  'https://ghproxy.net/',
]

const abis = [
  'arm64-v8a',
  'armeabi-v7a',
  'x86_64',
  'x86',
  'universal',
]

const isGithubUrl = (url) => {
  const host = (/^https?:\/\/([^/?#]+)/i.exec(url)?.[1] ?? '').toLowerCase()
  return host == 'github.com' || host == 'raw.githubusercontent.com' || host.endsWith('.githubusercontent.com')
}

/** GitHub 地址：各加速代理 + 直连兜底；其他地址保持原样 */
const urlCandidates = (url) => isGithubUrl(url) ? [...GITHUB_MIRRORS.map(m => m + url), url] : [url]

const manifestCandidates = () => {
  const bust = `?t=${Date.now()}`
  return [
    ...urlCandidates(MANIFEST_RAW_URL).map(u => u + bust),
    // jsDelivr 国内可达，但对分支有缓存，作为最后兜底
    `https://fastly.jsdelivr.net/gh/${UPDATE_REPO}@main/latest-android.json`,
    `https://cdn.jsdelivr.net/gh/${UPDATE_REPO}@main/latest-android.json`,
  ]
}

const requestJson = (url, timeout = 10000) => {
  return new Promise((resolve, reject) => {
    httpGet(url, { timeout }, (err, resp, body) => {
      if (err || resp.statusCode != 200) reject(err || new Error(resp.statusMessage || String(resp.statusCode)))
      else if (typeof body != 'object' || body == null) reject(new Error('invalid manifest'))
      else resolve(body)
    })
  })
}

/** 并发请求所有候选地址，第一个返回有效清单的胜出 */
const raceManifest = (urls) => {
  return new Promise((resolve, reject) => {
    let pending = urls.length
    let lastError = null
    let done = false
    for (const url of urls) {
      requestJson(url).then(info => {
        if (info.version == null) throw new Error('manifest missing version')
        if (!done) {
          done = true
          resolve(info)
        }
      }).catch(err => {
        lastError = err
      }).finally(() => {
        if (--pending == 0 && !done) reject(lastError ?? new Error('all mirrors failed'))
      })
    }
  })
}

let latestManifest = null

/**
 * 清单格式（由 .github/workflows/release.yml 生成）：
 * { version, versionCode, desc, history: [{ version, desc }], page, assets: { [abi]: url }, published }
 */
export const getVersionInfo = async() => {
  const info = await raceManifest(manifestCandidates())
  latestManifest = info
  return {
    version: String(info.version),
    desc: info.desc ?? '',
    history: Array.isArray(info.history) ? info.history : [],
  }
}

const getTargetAbi = async() => {
  const supportedAbis = await getSupportedAbis()
  for (const abi of abis) {
    if (supportedAbis.includes(abi)) return abi
  }
  return abis[abis.length - 1]
}

const getApkUrl = async(version) => {
  const abi = await getTargetAbi()
  const assets = latestManifest?.version == version ? latestManifest.assets : null
  if (assets) {
    const url = assets[abi] ?? assets.universal
    if (url) return url
  }
  return `https://github.com/${UPDATE_REPO}/releases/download/v${version}/lx-music-mobile-v${version}-${abi}.apk`
}

let downloadJobId = null
let canceled = false
const noop = (total, download) => {}
let apkSavePath

// 代理失败时常返回 200 + 很小的 HTML 错误页，按体积挡掉
const MIN_APK_SIZE = 1024 * 1024

const tryDownload = (url, savePath, onDownload) => {
  const { jobId, promise } = downloadFile(url, savePath, {
    progressInterval: 500,
    connectionTimeout: 15000,
    readTimeout: 20000,
    begin({ statusCode, contentLength }) {
      onDownload(contentLength, 0)
    },
    progress({ contentLength, bytesWritten }) {
      onDownload(contentLength, bytesWritten)
    },
  })
  downloadJobId = jobId
  return promise.then(({ statusCode, bytesWritten }) => {
    if (statusCode != 200) throw new Error(`HTTP ${statusCode}`)
    if (bytesWritten < MIN_APK_SIZE) throw new Error(`suspicious body (${bytesWritten})`)
  })
}

/**
 * 下载新版本 APK：依次尝试加速代理与直连，失败自动切换下一个地址
 */
export const downloadNewVersion = async(version, onDownload = noop) => {
  const url = await getApkUrl(version)
  const savePath = temporaryDirectoryPath + '/lx-music-mobile.apk'

  if (downloadJobId) stopDownload(downloadJobId)
  canceled = false

  let lastError = null
  for (const candidate of urlCandidates(url)) {
    if (canceled) break
    try {
      console.log('[updater] downloading', candidate)
      await tryDownload(candidate, savePath, onDownload)
      downloadJobId = null
      apkSavePath = savePath
      return updateApp()
    } catch (err) {
      console.log('[updater] download failed', candidate, err?.message)
      lastError = err
      if (await existsFile(savePath).catch(() => false)) await unlink(savePath).catch(() => {})
    }
  }
  downloadJobId = null
  throw lastError ?? new Error('download failed')
}

export const cancelDownload = () => {
  canceled = true
  if (downloadJobId) stopDownload(downloadJobId)
  downloadJobId = null
}

export const updateApp = async() => {
  if (!apkSavePath) throw new Error('apk Save Path is null')
  await installApk(apkSavePath, APP_PROVIDER_NAME)
}
