@echo off
REM 可视化精英协作系统 V2 - 启动脚本 (Windows)

echo.
echo ==================================
echo 🚀 可视化精英协作系统 V2
echo ==================================
echo.

REM 进入脚本所在目录
cd /d "%~dp0"

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未安装 Node.js
    echo.
    echo 请先安装 Node.js：
    echo 1. 访问 https://nodejs.org/
    echo 2. 下载并安装 LTS 版本
    echo 3. 重新运行此脚本
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
echo.

REM 检查依赖
if not exist "node_modules" (
    echo 📦 首次运行，正在安装依赖...
    echo.
    call npm install

    if %errorlevel% neq 0 (
        echo.
        echo ❌ 依赖安装失败
        echo 请检查网络连接
        echo.
        pause
        exit /b 1
    )

    echo.
    echo ✅ 依赖安装完成
    echo.
)

REM 启动服务器
echo 🎯 启动服务器...
echo.
call npm start
