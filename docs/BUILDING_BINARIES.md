# 静态二进制文件构建指南

## 概述

本项目需要 `ffmpeg` 和 `aria2` 两个外部可执行文件。为了确保应用可以在任何系统上运行(包括没有安装这些依赖的系统),我们使用静态链接的可执行文件。

## 为什么需要静态二进制文件?

直接从系统复制 ffmpeg 和 aria2 的可执行文件存在问题:
- **动态链接依赖**: 这些文件通常依赖系统库,在不同环境上可能无法运行
- **版本差异**: 不同系统的库版本可能不兼容
- **部署限制**: 用户系统可能缺少必需的共享库

静态链接的二进制文件将所有依赖编译进可执行文件,确保:
- ✅ 可独立运行,无需系统依赖
- ✅ 在任何相同架构的系统上都能运行
- ✅ 版本固定,行为可预测

## 二进制文件来源

项目使用预编译的静态二进制文件,这些文件已经手动构建并上传到 GitHub Releases:

- **下载地址**: https://github.com/tekintian/double-mouse-downloader/releases/tag/v1
- **压缩包**: `bin.zip` (包含 macOS 和 Windows 的静态二进制文件)

`bin/` 目录已被 `.gitignore` 排除,不纳入版本控制。

## 构建说明

### 首次构建

```bash
# 下载预编译的二进制文件
npm run download-bin
```

这将:
1. 从 GitHub Releases 下载 `bin.zip`
2. 解压到 `bin/` 目录
3. 设置正确的执行权限

### 后续构建

```bash
# 构建应用 (会自动先下载二进制文件)
npm run build
```

`download-bin` 会自动在构建前执行,确保 `bin/` 目录有所需的二进制文件。

## 自定义下载地址

如需使用自定义的下载地址,在项目根目录创建 `.env` 文件:

```bash
BIN_DOWNLOAD_URL=https://your-custom-url/binaries.zip
```

或在命令行设置环境变量:

```bash
export BIN_DOWNLOAD_URL=https://your-custom-url/binaries.zip
npm run download-bin
```

## 手动编译二进制文件 (可选)

如果需要手动编译静态二进制文件,可以使用提供的编译脚本:

### macOS (Intel & Apple Silicon)

```bash
# Intel x64
bash scripts/build-static-binaries.sh darwin x64

# Apple Silicon ARM64
bash scripts/build-static-binaries.sh darwin arm64
```

**依赖安装:**
```bash
brew install autoconf automake libtool pkg-config yasm nasm
brew install x264
brew install libssh2 libxml2
```

### Linux (x64)

```bash
bash scripts/build-static-binaries.sh linux x64
```

**依赖安装 (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install -y build-essential autoconf automake libtool pkg-config yasm nasm
sudo apt-get install -y libx264-dev
sudo apt-get install -y libssh2-1-dev libxml2-dev libexpat1-dev
```

### Windows (x64)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-static-binaries.ps1
```

**注意:** Windows 平台使用预编译的静态二进制文件,因为从源码编译非常复杂:
- ffmpeg: [Gyan FFmpeg Builds](https://www.gyan.dev/ffmpeg/builds/)
- aria2: [aria2 Releases](https://github.com/aria2/aria2/releases)

## 更新预编译二进制文件

如果需要更新预编译的二进制文件:

1. 使用上述脚本手动编译各平台的二进制文件
2. 组织文件结构:
   ```
   bin/
   ├── darwin/x64/ffmpeg, aria2c
   ├── darwin/arm64/ffmpeg, aria2c
   └── win32/x64/ffmpeg.exe, aria2c.exe
   ```
3. 压缩为 `bin.zip`
4. 上传到 GitHub Releases tag v1
5. 更新 `download-bin.js` 中的下载 URL (如需修改)

## 在 CI/CD 中使用

项目已配置 GitHub Actions 自动下载预编译的二进制文件,每次推送代码到 `dev` 分支时会执行 `npm run download-bin`:

- 自动从 GitHub Releases 下载最新的静态二进制文件
- 确保构建环境总有正确的二进制文件
- 无需在 CI 环境中编译,节省时间和资源

查看 `.github/workflows/build.yml` 了解详细配置。

## 手动编译二进制文件 (可选)

如果需要手动编译静态二进制文件,可以使用提供的编译脚本:

### 平台特定说明

构建完成后,可以使用以下命令验证二进制文件是否正确:

```bash
# macOS/Linux
file bin/darwin/x64/ffmpeg
file bin/darwin/x64/aria2c
ldd bin/linux/x64/ffmpeg 2>/dev/null || otool -L bin/darwin/x64/ffmpeg

# Windows
bin\win32\x64\ffmpeg.exe -version
bin\win32\x64\aria2c.exe --version
```

静态链接的二进制文件应该显示为静态可执行文件或只链接到基本的系统库。

## 输出目录结构

```
bin/
├── darwin/
│   ├── x64/
│   │   ├── ffmpeg
│   │   └── aria2c
│   └── x64/
│       ├── ffmpeg
│       └── aria2c
├── linux/
│   ├── x64/
│   │   ├── ffmpeg
│   │   └── aria2c
│   └── arm64/
│       ├── ffmpeg
│       └── aria2c
└── win32/
    └── x64/
        ├── ffmpeg.exe
        └── aria2c.exe
```

## 故障排除

### 下载失败

检查网络连接,或验证 GitHub Releases 是否存在 `bin.zip`:
- Releases 地址: https://github.com/tekintian/double-mouse-downloader/releases/tag/v1

### macOS/Linux: 编译失败

1. 确保安装了 Xcode 命令行工具:
   ```bash
   xcode-select --install
   ```

2. 确保所有依赖已正确安装

## 技术细节

### ffmpeg 静态编译选项

- `--enable-static --disable-shared`: 静态链接
- `--disable-debug`: 减小文件大小
- `--disable-doc`: 不生成文档
- `--enable-libx264`: H.264 编码支持
- 最小化配置,只包含必要的解码器和复用器

### aria2 静态编译选项

- `--enable-static --disable-shared`: 静态链接
- `--without-libxml2`: 禁用 XML-RPC (减少依赖)
- `--without-libexpat`: 禁用 expat
- `--disable-ssl`: 禁用 SSL (可选,根据需求)

## 参考

- [ffmpeg 官方文档](https://ffmpeg.org/documentation.html)
- [aria2 官方文档](https://aria2.github.io/)
- [Linux From Scratch - 构建静态库](https://www.linuxfromscratch.org/lfs/view/stable/chapter06/gcc-static.html)
