# Windows PowerShell 脚本：下载预编译的静态 ffmpeg 和 aria2 二进制文件
# Windows 平台编译静态二进制文件非常复杂，建议使用官方预编译版本

$ErrorActionPreference = "Stop"

# 颜色输出函数
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Log-Info {
    Write-ColorOutput Green "[INFO] $args"
}

function Log-Warn {
    Write-ColorOutput Yellow "[WARN] $args"
}

function Log-Error {
    Write-ColorOutput Red "[ERROR] $args"
}

# 获取架构
$ARCH = if ($env:PROCESSOR_ARCHITECTURE -eq "AMD64") { "x64" } else { "ia32" }

Log-Info "平台: win32"
Log-Info "架构: $ARCH"

# 输出目录
$OUTPUT_DIR = Join-Path $PSScriptRoot "..\bin\win32\$ARCH"
New-Item -ItemType Directory -Force -Path $OUTPUT_DIR | Out-Null

Log-Info "输出目录: $OUTPUT_DIR"

# 临时下载目录
$TEMP_DIR = Join-Path $env:TEMP "double-mouse-build-temp"
New-Item -ItemType Directory -Force -Path $TEMP_DIR | Out-Null

# ============================================
# 函数: 下载并解压文件
# ============================================
function Download-Extract {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Pattern,
        [string]$TargetFile
    )

    Log-Info "下载 $Name..."

    $zipFile = Join-Path $TEMP_DIR "$Name.zip"

    if (-not (Test-Path $zipFile)) {
        try {
            Invoke-WebRequest -Uri $Url -OutFile $zipFile -UseBasicParsing
        } catch {
            Log-Error "下载 $Name 失败: $_"
            exit 1
        }
    }

    Log-Info "解压 $Name..."

    # 使用 PowerShell 5.1+ 的 Expand-Archive
    Expand-Archive -Path $zipFile -DestinationPath $TEMP_DIR -Force

    # 查找匹配的文件
    $extractedFile = Get-ChildItem -Path $TEMP_DIR -Recurse -Filter $Pattern | Select-Object -First 1

    if (-not $extractedFile) {
        Log-Error "未找到 $Pattern"
        exit 1
    }

    # 复制到输出目录
    Copy-Item -Path $extractedFile.FullName -Destination $TargetFile -Force

    Log-Info "$Name 已复制到 $TargetFile"
}

# ============================================
# 下载 ffmpeg
# ============================================
Log-Info "=== 下载 ffmpeg ==="

# 使用 gyan.dev 的预编译版本
# 最新版本链接需要手动更新
$FFmpegVersions = @{
    "6.0" = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
}

$FFmpegUrl = $FFmpegVersions["6.0"]
$TargetFFmpeg = Join-Path $OUTPUT_DIR "ffmpeg.exe"

if (Test-Path $TargetFFmpeg) {
    Log-Info "ffmpeg 已存在，跳过下载"
} else {
    Download-Extract -Name "ffmpeg" -Url $FFmpegUrl -Pattern "ffmpeg.exe" -TargetFile $TargetFFmpeg
}

# ============================================
# 下载 aria2
# ============================================
Log-Info "=== 下载 aria2 ==="

# aria2 官方预编译版本
$Aria2Versions = @{
    "1.37.0" = "https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0-win-64bit-build1.zip"
}

$Aria2Url = $Aria2Versions["1.37.0"]
$TargetAria2 = Join-Path $OUTPUT_DIR "aria2c.exe"

if (Test-Path $TargetAria2) {
    Log-Info "aria2 已存在，跳过下载"
} else {
    Download-Extract -Name "aria2" -Url $Aria2Url -Pattern "aria2c.exe" -TargetFile $TargetAria2
}

# ============================================
# 清理临时文件
# ============================================
Remove-Item -Path $TEMP_DIR -Recurse -Force -ErrorAction SilentlyContinue

# ============================================
# 显示结果
# ============================================
Log-Info "=== 构建完成 ==="
Log-Info "输出目录: $OUTPUT_DIR"
Log-Info "包含的文件:"

Get-ChildItem -Path $OUTPUT_DIR -File | ForEach-Object {
    $size = [math]::Round($_.Length / 1MB, 2)
    Log-Info "$($_.Name) : $size MB"
}
