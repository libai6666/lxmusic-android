// 自动递增版本号：更新 package.json 的 version 与 versionCode（android/app/build.gradle 会直接读取这两个字段）
// 用法：
//   npm run bump            # 补丁号 +1，例如 1.8.4 -> 1.8.5
//   npm run bump -- minor   # 次版本号 +1，例如 1.8.4 -> 1.9.0
//   npm run bump -- major   # 主版本号 +1，例如 1.8.4 -> 2.0.0
//   npm run bump -- 1.9.2   # 直接指定版本号
const fs = require('fs')
const path = require('path')

const pkgPath = path.join(__dirname, '../package.json')
const versionReg = /^\d+\.\d+\.\d+$/

const bump = (version, type) => {
  const [major, minor, patch] = version.split('.').map(Number)
  switch (type) {
    case 'major': return `${major + 1}.0.0`
    case 'minor': return `${major}.${minor + 1}.0`
    case 'patch': return `${major}.${minor}.${patch + 1}`
    default:
      if (!versionReg.test(type)) throw new Error(`无效的版本号或类型: ${type}（支持 major / minor / patch / x.y.z）`)
      return type
  }
}

const run = () => {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  if (!versionReg.test(pkg.version)) throw new Error(`package.json 中的版本号格式不正确: ${pkg.version}`)

  const prevVersion = pkg.version
  const prevVersionCode = pkg.versionCode
  pkg.version = bump(prevVersion, process.argv[2] || 'patch')
  pkg.versionCode = (Number(prevVersionCode) || 0) + 1

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')

  console.log(`version: ${prevVersion} -> ${pkg.version}`)
  console.log(`versionCode: ${prevVersionCode} -> ${pkg.versionCode}`)
}

run()
