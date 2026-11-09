// 生成应用内更新清单 latest-android.json（由 GitHub Actions 调用）
// 用法：node publish/genUpdateManifest.js <updateRepo> <prevManifestPath> <outPath>
// 版本号取 package.json，更新说明取 publish/changeLog.md；
// history 由上一版清单滚动生成，保留最近 20 个版本。
const fs = require('fs')
const path = require('path')

const [updateRepo, prevPath, outPath] = process.argv.slice(2)
if (!updateRepo || !outPath) throw new Error('usage: genUpdateManifest.js <updateRepo> <prevManifestPath> <outPath>')

const pkg = require('../package.json')
const version = pkg.version
const tag = `v${version}`
const abis = ['arm64-v8a', 'armeabi-v7a', 'x86_64', 'x86', 'universal']

const desc = fs.readFileSync(path.join(__dirname, 'changeLog.md'), 'utf-8')
  .replace(/\r\n/g, '\n')
  .replace(/^#{1,6}\s*/gm, '')
  .trim()

let prev = null
if (prevPath && fs.existsSync(prevPath)) {
  try {
    prev = JSON.parse(fs.readFileSync(prevPath, 'utf-8').replace(/^\uFEFF/, ''))
  } catch (err) {
    console.warn('previous manifest is invalid, ignored:', err.message)
  }
}

let history = Array.isArray(prev?.history) ? prev.history : []
if (prev?.version && prev.version != version) {
  history = [{ version: prev.version, desc: prev.desc ?? '' }, ...history]
}
history = history.filter(h => h.version != version).slice(0, 20)

const assets = {}
for (const abi of abis) {
  assets[abi] = `https://github.com/${updateRepo}/releases/download/${tag}/${pkg.name}-${tag}-${abi}.apk`
}

const manifest = {
  version,
  versionCode: pkg.versionCode,
  desc,
  history,
  page: `https://github.com/${updateRepo}/releases/tag/${tag}`,
  assets,
  published: new Date().toISOString(),
}

fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8')
console.log(`manifest written: ${outPath} (${version}, history ${history.length})`)

