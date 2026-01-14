# 静态二进制文件迁移说明

## 变更概述

将原来从构建平台直接拷贝动态链接的 ffmpeg 和 aria2 可执行文件,改为使用预编译的静态链接二进制文件。

## 核心改进

### 问题
- 直接拷贝的二进制文件依赖系统共享库
- 离开构建平台后无法运行
- 不同系统库版本导致兼容性问题

### 解决方案
- 使用预编译的静态二进制文件
- 无系统依赖,可在任何相同架构的系统运行
- 版本固定,行为可预测
- 从 GitHub Releases 统一下载

## 构建流程

### 首次构建
```bash
# 下载预编译的二进制文件
npm run download-bin
```

### 后续构建
```bash
# 构建应用 (会自动先下载二进制文件)
npm run build
```

## 文件变更

### 保留文件
- `scripts/build-static-binaries.sh` - Unix 系统构建脚本 (用于手动编译)
- `scripts/build-static-binaries.ps1` - Windows 构建脚本 (用于手动编译)
- `scripts/build-binaries.js` - 跨平台构建入口 (用于手动编译)

### 修改文件
- `.github/workflows/build.yml` - 添加下载预编译二进制文件步骤
- `.github/workflows/build-static-binaries.yml` - 新增手动构建静态二进制文件的 workflow
- `package.json` - `build` 命令包含 `download-bin`
- `README.md` - 更新构建说明
- `.gitignore` - `bin/` 目录已排除
- `docs/BUILDING_BINARIES.md` - 更新文档

### 二进制文件来源
- **GitHub Releases**: https://github.com/tekintian/double-mouse-downloader/releases/tag/v1
- **压缩包**: `static-binaries-all-platforms.zip` 包含所有平台的静态二进制文件
- **新增**: `.github/workflows/build-static-binaries.yml` - 手动触发构建静态二进制文件

## CI/CD 行为

### 1. 日常构建 (.github/workflows/build.yml)

每次推送代码到 `dev` 分支时:
1. 下载预编译的二进制文件 (`npm run download-bin`)
2. 构建应用
3. 打包发布

### 2. 静态二进制文件构建 (.github/workflows/build-static-binaries.yml)

需要更新二进制文件时,手动触发:
1. 支持选择特定平台或全部平台
2. 可选择是否上传到 GitHub Releases
3. 自动打包为 `static-binaries-all-platforms.zip` 并上传
4. 各平台产物保留 7 天作为 artifacts

## 技术细节

### 预编译静态二进制文件
- ffmpeg: 静态链接,包含 H.264 编码支持
- aria2: 静态链接,支持所有核心下载功能
- 平台支持: macOS (x64, arm64), Windows (x64)

### 手动编译 (可选)

如果需要手动编译二进制文件:

**macOS/Linux:**
```bash
bash scripts/build-static-binaries.sh darwin x64
```

**Windows:**
```powershell
powershell -ExecutionPolicy Bypass -File scripts\build-static-binaries.ps1
```

### 更新预编译文件

1. 在 GitHub 手动触发 "Build Static Binaries" workflow
2. 选择需要构建的平台
3. 勾选 "Upload to GitHub Releases"
4. 等待构建完成,自动上传

或手动操作:
1. 手动编译或下载最新版本
2. 组织文件结构并压缩为 `static-binaries-all-platforms.zip`
3. 上传到 GitHub Releases tag v1
4. 更新 `download-bin.js` 中的下载 URL

## 输出目录结构

```
bin/
├── darwin/
│   ├── x64/ffmpeg, aria2c
│   └── arm64/ffmpeg, aria2c
├── linux/
│   ├── x64/ffmpeg, aria2c
│   └── arm64/ffmpeg, aria2c
└── win32/
    └── x64/ffmpeg.exe, aria2c.exe
```

**注意**: `bin/` 目录已被 `.gitignore` 排除,不纳入版本控制。
