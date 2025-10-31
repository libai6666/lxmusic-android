# lx-music-mobile Android 打包指南

## 📋 目录
- [环境要求](#环境要求)
- [环境变量配置](#环境变量配置)
- [🚀 Android Studio 快速调试开发（推荐）](#-android-studio-快速调试开发推荐)
- [调试版本打包](#调试版本打包)
- [正式版本打包](#正式版本打包)
- [常见问题](#常见问题)

---

## 🔧 环境要求

### 必需软件
- **Node.js**: v16+ 
- **JDK**: 17 或 11
- **Android SDK**: API Level 21-35
- **Android NDK**: 26.1.10909125
- **Gradle**: 8.8 (自动下载)

### 检查环境
```powershell
# 检查 Node 版本
node --version

# 检查 Java 版本
java -version

# 检查 Android SDK
echo $env:ANDROID_HOME
```

---

## 🌍 环境变量配置

### ⚠️ 重要：避免中文路径问题

由于本项目使用了 `react-native-quick-base64` 等 C++ 原生模块，必须确保 Gradle 缓存路径不包含中文。

### 方法一：设置系统环境变量（推荐）

1. 右键"此电脑" → 属性 → 高级系统设置 → 环境变量
2. 在"用户变量"中点击"新建"
3. 设置以下变量：

| 变量名 | 变量值 | 说明 |
|--------|--------|------|
| `GRADLE_USER_HOME` | `D:\tools\Pycharm\PycharmWork\lx-music-mobile\.gradle_home` | Gradle 用户目录（改为你的项目路径） |
| `TEMP` | `D:\Temp` | 临时文件目录（无中文路径） |
| `TMP` | `D:\Temp` | 临时文件目录（无中文路径） |
| `ANDROID_HOME` | `你的Android SDK路径` | 例如：`C:\Android\Sdk` |

4. 确保创建对应的目录：
```powershell
# 创建临时目录
New-Item -ItemType Directory -Path "D:\Temp" -Force

# 创建 Gradle 缓存目录
New-Item -ItemType Directory -Path "项目路径\.gradle_home" -Force
```

5. **重启 PowerShell 或 IDE** 使环境变量生效

### 方法二：每次构建前临时设置

如果不想修改系统环境变量，可以在每次构建前设置：

```powershell
# 设置环境变量
$env:GRADLE_USER_HOME="D:\tools\Pycharm\PycharmWork\lx-music-mobile\.gradle_home"
$env:TEMP="D:\Temp"
$env:TMP="D:\Temp"
```

---

## 🚀 Android Studio 快速调试开发（推荐）

这是**最推荐的开发方式**，支持热重载、快速刷新，无需每次都完整构建 APK！

### 📱 准备工作

#### 方式 A：使用 Android 模拟器（推荐新手）

1. **在 Android Studio 中创建模拟器**：
   - 打开 Android Studio
   - 点击 `工具` → `设备管理器` (或 `Device Manager`)
   - 点击 `创建设备` (或左上角的 `+` 号)
   - 选择设备型号（推荐：Pixel 6 或 Pixel 5）
   - 点击 `下一步`
   - 选择系统镜像（推荐：Android 13 (API 33) 或 Android 11 (API 30)）
     - 如果没有下载，点击镜像旁边的 `下载` 按钮
   - 点击 `下一步` → `完成`

2. **启动模拟器**：
   - 在设备管理器中找到刚创建的模拟器
   - 点击播放按钮 ▶️ 启动
   - 等待模拟器完全启动（显示桌面）

#### 方式 B：使用真实设备（推荐）

1. **启用开发者选项**：
   - 设置 → 关于手机 → 连续点击"版本号" 7次
   - 返回设置，进入"开发者选项"

2. **启用 USB 调试**：
   - 开发者选项 → 打开"USB 调试"
   - 开发者选项 → 打开"USB 安装"（部分手机）

3. **连接电脑**：
   - 使用 USB 线连接手机和电脑
   - 手机上授权"允许 USB 调试"
   - 验证连接：
   ```powershell
   # 在项目根目录执行
   adb devices
   # 应该显示你的设备
   ```

### 🎯 方法一：使用 React Native CLI（最快速）

这是最常用的开发方式，支持自动热重载。

#### 步骤 1: 启动 Metro Bundler

```powershell
# 在项目根目录打开第一个终端窗口
cd D:\tools\Pycharm\PycharmWork\lx-music-mobile

# 设置环境变量（如果还没设置系统变量）
$env:GRADLE_USER_HOME="$PWD\.gradle_home"

# 启动 Metro 开发服务器
npm start
# 或
npx react-native start
```

**Metro 会在端口 8081 启动，保持这个窗口运行！**

#### 步骤 2: 运行应用到设备

打开**第二个终端窗口**：

```powershell
# 确保在项目根目录
cd D:\tools\Pycharm\PycharmWork\lx-music-mobile

# 设置环境变量
$env:GRADLE_USER_HOME="$PWD\.gradle_home"

# 运行到设备（首次会自动构建和安装）
npx react-native run-android

```

**🎉 完成！应用会自动安装并启动，支持热重载！**

#### 开发体验特性

- **✅ 快速刷新 (Fast Refresh)**：保存代码后自动刷新，保持应用状态
- **✅ 热重载 (Hot Reload)**：即时看到代码更改效果
- **✅ 错误提示**：代码错误会直接显示在设备上

### 🎯 方法二：在 Android Studio 中调试

这种方式可以使用 Android Studio 的调试工具（断点、日志等）。

#### 步骤 1: 用 Android Studio 打开项目

1. 打开 Android Studio
2. 点击 `文件` → `打开` (或 `File` → `Open`)
3. **重要**：选择项目的 `android` 文件夹（不是项目根目录！）
   ```
   D:\tools\Pycharm\PycharmWork\lx-music-mobile\android
   ```
4. 点击 `确定`
5. 等待 Gradle 同步完成（底部状态栏会显示进度）

#### 步骤 2: 配置运行配置（通常自动配置好）

1. 等待 Gradle 同步完成
2. 查看顶部工具栏的运行配置下拉框
3. 如果显示 `app`，说明配置正常
4. 如果需要修改配置：
   - 点击运行配置下拉框 → `编辑配置...` (或 `Edit Configurations...`)
   - 确保配置如下：
     - **模块** (Module): `lx-music-mobile.app.main`
     - **包** (Package): `cn.toside.music.mobile`
     - **启动选项** (Launch Options): `默认 Activity` 或 `Default Activity`

#### 步骤 3: 启动 Metro Bundler

在**单独的终端**中启动 Metro：

```powershell
cd D:\tools\Pycharm\PycharmWork\lx-music-mobile
npm start
```

#### 步骤 4: 在 Android Studio 中运行

1. **选择目标设备**：
   - 点击顶部工具栏的设备选择下拉框
   - 选择你的模拟器或已连接的真机

2. **运行应用**（三种方式任选其一）：
   - 点击 **运行** 按钮（绿色三角形 ▶️）
   - 或按快捷键 `Shift + F10`
   - 或点击 `运行` 菜单 → `运行 'app'`

3. **调试应用**（可设置断点）：
   - 点击 **调试** 按钮（绿色虫子 🐛）
   - 或按快捷键 `Shift + F9`
   - 或点击 `运行` 菜单 → `调试 'app'`

**优势**：
- ✅ 可以在 Java/Kotlin 代码中设置断点（点击代码行号左侧）
- ✅ 查看详细的 Logcat 日志（底部 `Logcat` 标签）
- ✅ 使用 Android Studio 的性能分析工具（`Profiler` 标签）
- ✅ 可以查看内存、CPU、网络使用情况

### 🎯 方法三：仅重新加载 JS 代码（超快）

当你只修改了 JavaScript/TypeScript 代码，不需要重新构建原生代码时：

#### 在设备上打开开发者菜单

- **Android 模拟器**: 按 `Ctrl + M` (Windows) 或 `Cmd + M` (Mac)
- **真实设备**: 摇晃手机

#### 开发者菜单选项

| 中文选项 | 英文选项 | 快捷键 | 说明 |
|---------|---------|--------|------|
| **重新加载** | Reload | `R + R` | 重新加载 JS 代码 |
| **调试** | Debug | - | 启用 Chrome 调试工具 |
| **启用快速刷新** | Enable Fast Refresh | - | 启用快速刷新（默认开启） |
| **显示性能监控** | Show Perf Monitor | - | 显示性能监控（FPS） |
| **切换元素检查器** | Toggle Inspector | - | 启用元素检查器 |
| **设置** | Settings | - | 配置服务器地址等 |

**最常用**：双击 `R` 键快速重载！

### 📝 开发工作流推荐

#### 方式 A：使用快速启动脚本（推荐）⭐

项目根目录提供了 `dev-start.ps1` 脚本，简化开发流程：

```powershell
# 在项目根目录执行
.\dev-start.ps1
```

**脚本功能菜单**：
1. 启动 Metro Bundler（开发服务器）
2. 运行应用到设备（首次安装）
3. 运行应用（仅 ARM64，更快）
4. 清理缓存并重新运行
5. 查看已连接的设备

**使用步骤**：
1. 打开第一个 PowerShell 窗口，运行 `.\dev-start.ps1`，选择 `1` 启动 Metro
2. 打开第二个 PowerShell 窗口，运行 `.\dev-start.ps1`，选择 `2` 或 `3` 运行应用
3. 修改代码 → 保存 → 自动刷新！

#### 方式 B：手动命令（传统方式）

```powershell
# ========== 第一次启动 ==========

# 终端 1: 启动 Metro
cd D:\tools\Pycharm\PycharmWork\lx-music-mobile
$env:GRADLE_USER_HOME="$PWD\.gradle_home"
npm start

# 终端 2: 安装应用到设备
npx react-native run-android

# ========== 日常开发 ==========

# 1. 修改代码（src/ 目录下的 .ts/.tsx/.js 文件）
# 2. 保存文件（Ctrl + S）
# 3. 应用自动刷新（Fast Refresh）
# 4. 如果没自动刷新，在设备上按 R + R

# ========== 修改了原生代码 ==========
# 如果修改了 android/ 目录下的文件，需要重新构建：

# 终端 2:
npx react-native run-android

# 或在 Android Studio 中点击 运行 按钮
```

### 🔧 高级技巧

#### 1. 只构建一个架构（加速构建）

```powershell
# 仅构建 ARM64（大多数现代手机）
npx react-native run-android --variant=debug --arch=arm64-v8a

# 或在 android/gradle.properties 中临时修改：
# reactNativeArchitectures=arm64-v8a
```

#### 2. 使用特定设备

```powershell
# 列出所有连接的设备
adb devices

# 指定设备运行
npx react-native run-android --deviceId=YOUR_DEVICE_ID
```

#### 3. 清理缓存后重新运行

```powershell
# 清理 Metro 缓存
npx react-native start --reset-cache

# 清理 Gradle 缓存并重新构建
cd android
.\gradlew.bat clean
cd ..
npx react-native run-android
```

#### 4. 使用 Chrome DevTools 调试

1. 在开发者菜单中选择 **Debug**
2. 浏览器会自动打开 `http://localhost:8081/debugger-ui/`
3. 打开浏览器的开发者工具（F12）
4. 在 Console 中可以看到 `console.log()` 输出
5. 可以设置断点、查看网络请求等

#### 5. Flipper 调试工具（可选）

Flipper 是 Meta 开发的强大调试工具：

```powershell
# 安装 Flipper (https://fbflipper.com/)
# 应用会自动连接到 Flipper

# Flipper 功能：
# - 查看 React 组件树
# - 网络请求监控
# - 数据库查看
# - Redux DevTools
# - 性能分析
```

### 🚨 常见开发问题

#### 1. Metro Bundler 连接失败

**错误**: "Could not connect to development server"

**解决方案**：
```powershell
# 确保 Metro 在运行
npm start

# 检查端口是否被占用
netstat -ano | findstr :8081

# 如果被占用，杀掉进程或换端口
npx react-native start --port 8082
```

在设备上配置新端口：
- 打开应用的开发者菜单（摇晃手机或 `Ctrl + M`）
- 点击 `设置` (Settings) → `调试服务器主机和端口` (Debug server host & port)
- 输入：`你的电脑IP:8082`（例如：`192.168.1.100:8082`）
- 点击确定，然后重新加载应用

#### 2. 无法连接真机

**解决方案**：
```powershell
# 1. 确认设备已连接
adb devices

# 2. 反向代理端口（让手机访问电脑的8081端口）
adb reverse tcp:8081 tcp:8081

# 3. 重新运行
npx react-native run-android
```

#### 3. 代码更改不生效

**解决方案**：
```powershell
# 1. 重启 Metro 并清除缓存
npx react-native start --reset-cache

# 2. 在设备上重新加载
# 按 R + R 或从开发者菜单选择 Reload

# 3. 如果还不行，重新安装应用
npx react-native run-android
```

#### 4. Gradle 构建失败

参考 [常见问题](#常见问题) 章节。

### 📊 性能监控

在开发过程中监控性能：

1. **开发者菜单** → **Show Perf Monitor**
   - 查看 JS 帧率和 UI 帧率
   - 目标：保持 60 FPS

2. **React DevTools**：
   ```powershell
   npx react-devtools
   ```
   - 查看组件渲染性能
   - 查看组件 props 和 state

3. **Android Studio Profiler（性能分析器）**：
   - 在 Android Studio 底部点击 **Profiler**（性能分析器）标签
   - 或点击 `视图` → `工具窗口` → `Profiler`
   - 可以监控：
     - CPU 使用情况
     - 内存使用情况
     - 网络活动
     - 能耗情况

### 🎓 开发最佳实践

1. **保持 Metro 运行**：不要频繁重启 Metro
2. **使用快速刷新**：让代码修改即时生效
3. **定期清理缓存**：遇到奇怪问题时清理缓存
4. **使用真机测试**：性能更接近生产环境
5. **启用热重载**：提高开发效率
6. **使用调试工具**：Chrome DevTools、React DevTools、Flipper
7. **监控性能**：及时发现性能问题

### 📖 Android Studio 中文菜单快速参考

| 中文菜单 | 英文菜单 | 用途 |
|---------|---------|------|
| 文件 → 打开 | File → Open | 打开项目 |
| 运行 → 运行 'app' | Run → Run 'app' | 运行应用 |
| 运行 → 调试 'app' | Run → Debug 'app' | 调试应用 |
| 工具 → SDK 管理器 | Tools → SDK Manager | 管理 Android SDK 和 NDK |
| 工具 → 设备管理器 | Tools → Device Manager | 管理模拟器和设备 |
| 视图 → 工具窗口 → Logcat | View → Tool Windows → Logcat | 查看日志 |
| 视图 → 工具窗口 → Profiler | View → Tool Windows → Profiler | 性能分析 |
| 构建 → 清理项目 | Build → Clean Project | 清理构建缓存 |
| 构建 → 重新构建项目 | Build → Rebuild Project | 重新构建 |

**快捷键：**
- `Shift + F10` - 运行
- `Shift + F9` - 调试
- `Ctrl + F9` - 构建项目
- `Alt + 4` - 打开 Logcat

---

## 🐛 调试版本打包

调试版本用于开发测试，包含调试信息，未进行代码混淆和优化。

### 步骤 1: 安装依赖

```powershell
# 确保在项目根目录
cd D:\tools\Pycharm\PycharmWork\lx-music-mobile

# 安装 npm 依赖
npm install
```

### 步骤 2: 清理旧的构建

```powershell
cd android
.\gradlew.bat clean
```

### 步骤 3: 构建 Debug APK

```powershell
# 在 android 目录下执行
.\gradlew.bat assembleDebug
```
```powershell
.\gradlew.bat assembleDebug -PreactNativeArchitectures=arm64-v8a
```
### 步骤 4: 查找生成的 APK

构建成功后，APK 文件位于：
```
android/app/build/outputs/apk/debug/
```

生成的文件：
- `lx-music-mobile-v1.7.1-arm64-v8a.apk` - ARM 64位（推荐用于大部分手机）
- `lx-music-mobile-v1.7.1-armeabi-v7a.apk` - ARM 32位
- `lx-music-mobile-v1.7.1-x86.apk` - x86 32位（模拟器）
- `lx-music-mobile-v1.7.1-x86_64.apk` - x86 64位（模拟器）
- `lx-music-mobile-v1.7.1-universal.apk` - 通用版（包含所有架构，体积大）

### 调试版签名信息

调试版使用默认的 debug keystore：
- **文件**: `android/app/debug.keystore`
- **密码**: `android`
- **别名**: `androiddebugkey`
- **别名密码**: `android`

---

## 🚀 正式版本打包

正式版本用于发布，经过代码混淆和优化，体积更小，性能更好。

### 前置要求：生成签名密钥

#### 选项 A：使用命令行生成密钥库

```powershell
# 切换到 android/app 目录
cd android/app

# 生成 release keystore
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# 按提示输入：
# - 密钥库密码（建议使用强密码）
# - 别名密码（建议与密钥库密码相同）
# - 姓名、组织等信息
```

#### 选项 B：使用 Android Studio 生成

1. 打开 Android Studio
2. Build → Generate Signed Bundle/APK
3. 选择 APK → Next
4. 点击 "Create new..." 创建新密钥库
5. 按提示填写信息并保存

### 步骤 1: 配置签名文件

在 `android/` 目录下创建 `keystore.properties` 文件：

```properties
storeFile=app/my-release-key.keystore
storePassword=你的密钥库密码
keyAlias=my-key-alias
keyPassword=你的别名密码
```

**⚠️ 重要安全提示：**
- `keystore.properties` 和 `.keystore` 文件不要提交到 Git
- 将它们添加到 `.gitignore`
- 妥善保管密钥库文件和密码，丢失后无法更新应用

```powershell
# 将以下内容添加到项目根目录的 .gitignore
echo "android/keystore.properties" >> .gitignore
echo "*.keystore" >> .gitignore
```

### 步骤 2: 清理旧构建

```powershell
cd android
.\gradlew.bat clean
```

### 步骤 3: 构建 Release APK

```powershell
# 在 android 目录下执行
.\gradlew.bat assembleRelease
```

### 步骤 4: 查找生成的 APK

构建成功后，APK 文件位于：
```
android/app/build/outputs/apk/release/
```

生成的文件：
- `lx-music-mobile-v1.7.1-arm64-v8a.apk` - ARM 64位（推荐发布）
- `lx-music-mobile-v1.7.1-armeabi-v7a.apk` - ARM 32位
- `lx-music-mobile-v1.7.1-x86.apk` - x86 32位
- `lx-music-mobile-v1.7.1-x86_64.apk` - x86 64位
- `lx-music-mobile-v1.7.1-universal.apk` - 通用版

### 步骤 5: 验证签名

```powershell
# 验证 APK 签名
keytool -printcert -jarfile android/app/build/outputs/apk/release/lx-music-mobile-v1.7.1-arm64-v8a.apk
```

---

## 📦 快速构建命令

### 一键构建调试版

```powershell
# PowerShell 完整命令
cd D:\tools\Pycharm\PycharmWork\lx-music-mobile
$env:GRADLE_USER_HOME="$PWD\.gradle_home"
cd android
.\gradlew.bat clean assembleDebug
```

### 一键构建正式版

```powershell
# PowerShell 完整命令
cd D:\tools\Pycharm\PycharmWork\lx-music-mobile
$env:GRADLE_USER_HOME="$PWD\.gradle_home"
cd android
.\gradlew.bat clean assembleRelease
```

### 仅构建特定架构

```powershell
# 仅构建 ARM64 版本（最常用）
.\gradlew.bat assembleDebug -PreactNativeArchitectures=arm64-v8a

# 仅构建 ARM32 版本
.\gradlew.bat assembleDebug -PreactNativeArchitectures=armeabi-v7a
```

---

## 🔍 构建输出说明

### APK 架构选择建议

| 架构 | 使用场景 | 推荐程度 |
|------|----------|----------|
| **arm64-v8a** | 现代 Android 手机（2015年后） | ⭐⭐⭐⭐⭐ |
| armeabi-v7a | 老旧 Android 手机（2015年前） | ⭐⭐⭐ |
| x86_64 | Android 模拟器、x86 平板 | ⭐⭐ |
| x86 | 老旧模拟器 | ⭐ |
| universal | 包含所有架构（体积大） | ⭐⭐⭐⭐ |

**发布建议：**
- **Google Play / 其他应用商店**: 上传 `arm64-v8a` 和 `armeabi-v7a` 版本
- **直接分发**: 使用 `universal` 版本（兼容所有设备，但体积较大）

---

## ❓ 常见问题

### 1. 构建失败：中文路径问题

**错误信息：**
```
[CXX1429] error when building with cmake
????????????·????
```

**解决方案：**
- 确保设置了 `GRADLE_USER_HOME` 环境变量
- 确保 `TEMP` 和 `TMP` 环境变量不包含中文
- 重启 PowerShell 或 IDE

### 2. 构建失败：内存不足

**错误信息：**
```
java.lang.OutOfMemoryError: Java heap space
```

**解决方案：**
编辑 `android/gradle.properties`，增加内存：
```properties
org.gradle.jvmargs=-Xmx8192m -XX:MaxMetaspaceSize=2048m
```

### 3. 签名配置错误

**错误信息：**
```
Execution failed for task ':app:packageRelease'
> A failure occurred while executing com.android.build.gradle.internal.tasks.Workers$ActionFacade
  > Failed to read key from keystore
```

**解决方案：**
- 检查 `android/keystore.properties` 中的路径和密码
- 确保 `.keystore` 文件存在
- 验证密码正确性

### 4. NDK 版本不匹配

**错误信息：**
```
NDK is not configured
```

**解决方案：**
在 Android Studio 中：
1. 点击 `工具` → `SDK 管理器` (或 `Tools` → `SDK Manager`)
2. 切换到 `SDK 工具` (SDK Tools) 标签页
3. 勾选 `NDK (Side by side)` 或 `NDK (并行)`
4. 点击 `应用` 按钮，安装 NDK 版本 `26.1.10909125`
5. 等待下载和安装完成

或编辑 `android/local.properties`：
```properties
ndk.dir=你的Android SDK路径/ndk/26.1.10909125
```

### 5. Gradle 守护进程卡死

**解决方案：**
```powershell
# 停止所有 Gradle 进程
cd android
.\gradlew.bat --stop

# 清理缓存
.\gradlew.bat clean --refresh-dependencies
```

### 6. 依赖下载失败

**解决方案：**
编辑 `android/build.gradle`，使用国内镜像：
```gradle
repositories {
    maven { url 'https://maven.aliyun.com/repository/google' }
    maven { url 'https://maven.aliyun.com/repository/public' }
    maven { url 'https://maven.aliyun.com/repository/jcenter' }
    google()
    mavenCentral()
}
```

---

## 📝 版本号管理

版本号在 `package.json` 中管理：

```json
{
  "version": "1.7.1",
  "versionCode": 171
}
```

- `version`: 显示给用户的版本号（语义化版本）
- `versionCode`: 数字版本号（必须递增，用于应用商店）

**更新版本：**
```json
{
  "version": "1.7.2",
  "versionCode": 172
}
```

---

## 🎯 优化构建速度

### 1. 启用 Gradle 守护进程

在 `android/gradle.properties` 中：
```properties
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
```

### 2. 限制架构

开发时只构建一个架构：
```powershell
.\gradlew.bat assembleDebug -PreactNativeArchitectures=arm64-v8a
```

### 3. 增量构建

不要每次都执行 `clean`，只在必要时清理。

---

## 📚 其他资源

- [React Native 官方文档](https://reactnative.dev/docs/signed-apk-android)
- [Android 签名文档](https://developer.android.com/studio/publish/app-signing)
- [Gradle 构建优化](https://docs.gradle.org/current/userguide/performance.html)

---

## 📄 许可证

本项目基于原项目许可证，详见 [LICENSE](./LICENSE) 文件。

---

**最后更新**: 2025-10-17
**维护者**: lx-music-mobile 团队

如有问题，请提交 Issue 或查看项目 Wiki。

