# Android Studio Gradle 同步修复脚本
# 解决网络连接问题，配置国内镜像

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Android Studio Gradle 同步修复工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置环境变量
Write-Host ">> 设置环境变量..." -ForegroundColor Yellow
$env:GRADLE_USER_HOME = "$PWD\.gradle_home"
Write-Host "   GRADLE_USER_HOME = $env:GRADLE_USER_HOME" -ForegroundColor Green

Write-Host ""
Write-Host "请选择操作：" -ForegroundColor Cyan
Write-Host "  1. 清理 Gradle 缓存并重新下载（推荐）" -ForegroundColor White
Write-Host "  2. 仅清理本地缓存" -ForegroundColor White
Write-Host "  3. 测试网络连接" -ForegroundColor White
Write-Host "  4. 退出" -ForegroundColor White
Write-Host ""

$choice = Read-Host "请输入选项 (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host ">> 开始清理和修复..." -ForegroundColor Yellow
        Write-Host "   警告：请先关闭 Android Studio！" -ForegroundColor Red
        Write-Host ""
        $confirm = Read-Host "已关闭 Android Studio？(y/n)"
        
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            # 清理项目 Gradle 缓存
            Write-Host ""
            Write-Host ">> 1/4 清理项目 Gradle 缓存..." -ForegroundColor Yellow
            if (Test-Path ".gradle_home") {
                Remove-Item -Path ".gradle_home\caches" -Recurse -Force -ErrorAction SilentlyContinue
                Write-Host "   ✓ 项目 Gradle 缓存已清理" -ForegroundColor Green
            }
            
            # 清理系统 Gradle 缓存（如果存在）
            Write-Host ""
            Write-Host ">> 2/4 清理系统 Gradle 缓存..." -ForegroundColor Yellow
            $userGradleHome = "$env:USERPROFILE\.gradle"
            if (Test-Path $userGradleHome) {
                Remove-Item -Path "$userGradleHome\caches" -Recurse -Force -ErrorAction SilentlyContinue
                Write-Host "   ✓ 系统 Gradle 缓存已清理" -ForegroundColor Green
            }
            
            # 清理 Android 构建缓存
            Write-Host ""
            Write-Host ">> 3/4 清理 Android 构建缓存..." -ForegroundColor Yellow
            cd android
            if (Test-Path "build") {
                Remove-Item -Path "build" -Recurse -Force -ErrorAction SilentlyContinue
            }
            if (Test-Path "app\build") {
                Remove-Item -Path "app\build" -Recurse -Force -ErrorAction SilentlyContinue
            }
            .\gradlew.bat clean
            cd ..
            Write-Host "   ✓ Android 构建缓存已清理" -ForegroundColor Green
            
            # 测试网络连接
            Write-Host ""
            Write-Host ">> 4/4 测试镜像连接..." -ForegroundColor Yellow
            try {
                $response = Invoke-WebRequest -Uri "https://maven.aliyun.com/repository/public" -TimeoutSec 5 -UseBasicParsing
                Write-Host "   ✓ 阿里云镜像连接正常" -ForegroundColor Green
            } catch {
                Write-Host "   ✗ 阿里云镜像连接失败" -ForegroundColor Red
            }
            
            try {
                $response = Invoke-WebRequest -Uri "https://mirrors.cloud.tencent.com/gradle/" -TimeoutSec 5 -UseBasicParsing
                Write-Host "   ✓ 腾讯云镜像连接正常" -ForegroundColor Green
            } catch {
                Write-Host "   ✗ 腾讯云镜像连接失败" -ForegroundColor Red
            }
            
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "  清理完成！" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "下一步操作：" -ForegroundColor Cyan
            Write-Host "1. 打开 Android Studio" -ForegroundColor White
            Write-Host "2. 打开项目的 android 文件夹" -ForegroundColor White
            Write-Host "3. 点击 文件 → 使 Gradle 文件与项目同步" -ForegroundColor White
            Write-Host "4. 等待同步完成（首次可能需要 3-5 分钟）" -ForegroundColor White
            Write-Host ""
        } else {
            Write-Host "操作已取消" -ForegroundColor Yellow
        }
    }
    
    "2" {
        Write-Host ""
        Write-Host ">> 清理本地缓存..." -ForegroundColor Yellow
        
        # 清理项目缓存
        if (Test-Path ".gradle_home\caches") {
            Remove-Item -Path ".gradle_home\caches" -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "   ✓ 项目缓存已清理" -ForegroundColor Green
        }
        
        # 清理构建缓存
        cd android
        .\gradlew.bat clean
        cd ..
        
        Write-Host "   ✓ 清理完成" -ForegroundColor Green
    }
    
    "3" {
        Write-Host ""
        Write-Host ">> 测试网络连接..." -ForegroundColor Yellow
        Write-Host ""
        
        # 测试阿里云
        Write-Host "测试阿里云镜像..." -ForegroundColor Gray
        try {
            $response = Invoke-WebRequest -Uri "https://maven.aliyun.com/repository/public" -TimeoutSec 5 -UseBasicParsing
            Write-Host "✓ 阿里云 Maven 镜像: 正常" -ForegroundColor Green
        } catch {
            Write-Host "✗ 阿里云 Maven 镜像: 失败" -ForegroundColor Red
            Write-Host "  错误: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # 测试腾讯云
        Write-Host "测试腾讯云镜像..." -ForegroundColor Gray
        try {
            $response = Invoke-WebRequest -Uri "https://mirrors.cloud.tencent.com/gradle/" -TimeoutSec 5 -UseBasicParsing
            Write-Host "✓ 腾讯云 Gradle 镜像: 正常" -ForegroundColor Green
        } catch {
            Write-Host "✗ 腾讯云 Gradle 镜像: 失败" -ForegroundColor Red
            Write-Host "  错误: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # 测试 Google 官方源
        Write-Host "测试 Google 官方源..." -ForegroundColor Gray
        try {
            $response = Invoke-WebRequest -Uri "https://dl.google.com/android/repository/addons_list-3.xml" -TimeoutSec 5 -UseBasicParsing
            Write-Host "✓ Google 官方源: 正常" -ForegroundColor Green
        } catch {
            Write-Host "✗ Google 官方源: 失败（正常，使用镜像即可）" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "如果镜像连接失败，请检查：" -ForegroundColor Cyan
        Write-Host "- 网络连接是否正常" -ForegroundColor Gray
        Write-Host "- 防火墙是否拦截" -ForegroundColor Gray
        Write-Host "- 是否需要配置代理" -ForegroundColor Gray
    }
    
    "4" {
        Write-Host ""
        Write-Host "退出脚本" -ForegroundColor Yellow
        exit
    }
    
    default {
        Write-Host ""
        Write-Host "无效的选项，请重新运行脚本" -ForegroundColor Red
    }
}

Write-Host ""
pause


