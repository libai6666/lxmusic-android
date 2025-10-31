# lx-music-mobile 快速开发启动脚本
# 使用方法：在项目根目录执行 .\dev-start.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  lx-music-mobile 开发环境启动脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置环境变量
Write-Host ">> 设置环境变量..." -ForegroundColor Yellow
$env:GRADLE_USER_HOME = "$PWD\.gradle_home"
Write-Host "   GRADLE_USER_HOME = $env:GRADLE_USER_HOME" -ForegroundColor Green

# 检查设备连接
Write-Host ""
Write-Host ">> 检查设备连接..." -ForegroundColor Yellow
$devices = adb devices
if ($devices -match "device$") {
    Write-Host "   ✓ 检测到已连接的设备" -ForegroundColor Green
} else {
    Write-Host "   ⚠ 未检测到设备，请连接手机或启动模拟器" -ForegroundColor Red
    Write-Host "   提示：如果使用真机，请确保已开启 USB 调试" -ForegroundColor Yellow
}

# 显示选项
Write-Host ""
Write-Host "请选择操作：" -ForegroundColor Cyan
Write-Host "  1. 启动 Metro Bundler（开发服务器）" -ForegroundColor White
Write-Host "  2. 运行应用到设备（首次安装）" -ForegroundColor White
Write-Host "  3. 运行应用（仅 ARM64，更快）" -ForegroundColor White
Write-Host "  4. 清理缓存并重新运行" -ForegroundColor White
Write-Host "  5. 查看已连接的设备" -ForegroundColor White
Write-Host "  6. 退出" -ForegroundColor White
Write-Host ""

$choice = Read-Host "请输入选项 (1-6)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host ">> 启动 Metro Bundler..." -ForegroundColor Yellow
        Write-Host "   提示：Metro 启动后请保持此窗口运行" -ForegroundColor Cyan
        Write-Host "   提示：要停止 Metro，请按 Ctrl+C" -ForegroundColor Cyan
        Write-Host ""
        npm start
    }
    "2" {
        Write-Host ""
        Write-Host ">> 运行应用到设备..." -ForegroundColor Yellow
        Write-Host "   提示：首次运行会自动构建和安装 APK" -ForegroundColor Cyan
        Write-Host "   提示：请确保 Metro 已在另一个终端窗口中运行" -ForegroundColor Cyan
        Write-Host ""
        npx react-native run-android
    }
    "3" {
        Write-Host ""
        Write-Host ">> 运行应用（仅 ARM64）..." -ForegroundColor Yellow
        Write-Host "   提示：构建速度更快，适用于大部分现代手机" -ForegroundColor Cyan
        Write-Host ""
        npx react-native run-android --variant=debug --arch=arm64-v8a
    }
    "4" {
        Write-Host ""
        Write-Host ">> 清理缓存..." -ForegroundColor Yellow
        
        # 清理 Metro 缓存
        Write-Host "   - 清理 Metro 缓存..." -ForegroundColor Gray
        if (Test-Path "$env:TEMP\metro-*") {
            Remove-Item -Path "$env:TEMP\metro-*" -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        # 清理 node_modules 缓存
        Write-Host "   - 清理 node_modules 缓存..." -ForegroundColor Gray
        if (Test-Path "node_modules\.cache") {
            Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        # 清理 Gradle 缓存
        Write-Host "   - 清理 Gradle 缓存..." -ForegroundColor Gray
        cd android
        .\gradlew.bat clean
        cd ..
        
        Write-Host "   ✓ 缓存清理完成" -ForegroundColor Green
        Write-Host ""
        Write-Host ">> 重新运行应用..." -ForegroundColor Yellow
        npx react-native start --reset-cache
    }
    "5" {
        Write-Host ""
        Write-Host ">> 已连接的设备列表：" -ForegroundColor Yellow
        adb devices
        Write-Host ""
        Write-Host "提示：如果没有设备，请检查：" -ForegroundColor Cyan
        Write-Host "  - 手机是否已开启 USB 调试" -ForegroundColor Gray
        Write-Host "  - USB 线是否正常连接" -ForegroundColor Gray
        Write-Host "  - 是否已安装手机驱动" -ForegroundColor Gray
        Write-Host "  - 或启动 Android Studio 中的模拟器" -ForegroundColor Gray
        Write-Host ""
        pause
    }
    "6" {
        Write-Host ""
        Write-Host "退出脚本" -ForegroundColor Yellow
        exit
    }
    default {
        Write-Host ""
        Write-Host "无效的选项，请重新运行脚本" -ForegroundColor Red
        pause
    }
}

