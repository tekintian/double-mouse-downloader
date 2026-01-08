# 鼠鼠下载器 🐭

![LOGO](./build-resources/icon.png)

**✨ 让哔哩哔哩视频下载变得前所未有的简单高效！✨**

鼠鼠下载器是一款精心打造的跨平台哔哩哔哩视频下载工具，为您提供极速、稳定、便捷的视频下载体验。无论是番剧、电影、电视剧还是UP主投稿，只需轻轻一点，即可轻松获取！

## 下载

[🚀 立即下载最新版本](https://github.com/tekintian/double-mouse-downloader/releases)

## 支持操作系统

- ✅ Windows 7/10/11 x64
- ✅ macOS (Intel/ARM 双架构完美支持)
- ✅ Linux Desktop (多种发行版兼容)

## 特性

🌟 **跨平台自由**：无论您使用什么系统，鼠鼠下载器都能完美适配

🌟 **绿色免安装**：解压即用，无需繁琐安装过程，不占用系统资源

🌟 **光速下载**：基于 Aria2 引擎，多线程加速，下载速度快到飞起

🌟 **灵活登录**：支持二维码、密码、短信、Cookie 四种登录方式，总有一种适合您

🌟 **智能代理**：内置代理配置，轻松应对各种网络环境

🌟 **一键解析**：番剧/电视剧/电影/UP主投稿，通通一键搞定

🌟 **智能构建**：先进的智能化构建系统，确保多平台兼容性和最佳性能

## 智能化构建系统

鼠鼠下载器采用了先进的智能化构建系统，确保在各种平台上的稳定运行和最佳性能：

### 自动依赖管理
- 自动检测并安装所需依赖（Aria2、FFmpeg）
- 跨平台依赖适配，Windows、macOS、Linux 均有专门处理
- 使用 `check-binaries.js` 脚本智能检测和复制二进制文件

### 多平台构建矩阵
- **Windows**：x64 架构，支持 NSIS 安装包和 7z 压缩包
- **macOS**：支持 x64 和 arm64 双架构
- **Linux**：支持多种格式（deb、rpm、AppImage、tar.gz、snap）

### CI/CD 自动化流程
- 基于 GitHub Actions 的自动化构建系统
- 代码提交后自动触发构建流程
- 多平台并行构建，提高效率
- 自动打包和产物上传

### 智能二进制文件管理
```javascript
// 自动检测平台和架构
const platform = process.platform;
const arch = process.arch;

// 智能选择二进制文件名
const binaries = {
  aria2c: platform === 'win32' ? 'aria2c.exe' : 'aria2c',
  ffmpeg: platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
};

// 自动查找和复制二进制文件到项目目录
// ...
```

### 产物管理
- 自动清理临时文件，避免构建冲突
- 多架构产物分开打包
- 统一的产物命名规范，便于识别

## 程序截图

![程序截图-主界面](./assets/screenshots/main-page.jpg)

![程序截图-视频列表](./assets/screenshots/video-list.jpg)

![程序截图-下载队列](./assets/screenshots/download-queue.jpg)

![程序截图-配置页](./assets/screenshots/config-page.jpg)

![程序截图-番剧列表](./assets/screenshots/bangumi-list.jpg)

## 快速开始

### 安装依赖

> 请确保已安装 Node.js 16.20 和 Yarn 包管理器 。如果未安装，请根据您的操作系统从 [Node.js 官方网站](https://nodejs.org/) 下载并安装。
同时当前系统还需要安装:
 - [FFmpeg](https://ffmpeg.org/download.html) 。如果未安装，请根据您的操作系统从 [FFmpeg 官方网站](https://ffmpeg.org/download.html) 下载并安装。

 windows 平台预构建版本下载：
https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip
https://www.gyan.dev/ffmpeg/builds/packages/ffmpeg-8.0.1-essentials_build.7z
https://github.com/GyanD/codexffmpeg/releases?page=52
随意下载一个即可，下载后将ffmpeg.exe文件拷贝到bin目录即可
windows安装后的路径 C:\Users\yourname\AppData\Local\Programs\double-mouse-downloader\resources\bin\win32\x64

 - [Aria2](https://aria2.github.io/) 。如果未安装，请根据您的操作系统从 [Aria2 官方网站](https://github.com/aria2/aria2/releases) 下载并安装。
 https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0-win-64bit-build1.zip

 - Electron v19.0.3

```bash
# node 版本 16.20.x
# yarn 版本: 1.22.x
yarn install --frozen-lockfile
```

### 开发模式
```bash
yarn start

# 程序运行端口 默认 3000 , 通过环境变量 VITE_PORT 可以自定义端口
# 在 package.json 中可以自定义端口
# 开发模式下，渲染进程会从该端口加载内容
# 生产模式下，渲染进程会从打包后的静态资源加载内容

```

### 构建应用
```bash
yarn build

```

### 打包应用
```bash
# 打包当前平台
npm run dist

# 打包指定平台和架构
npm run dist -- --mac --x64
npm run dist -- --mac --arm64
npm run dist -- --win
npm run dist -- --linux


# 打包 macOS x64 架构，不发布到 GitHub Releases，压缩方式为 store，不签名
rm -rf dist build && npm run dist -- --mac --x64 --publish never --config.compression=store --config.mac.identity=null


```

## 技术栈

- **主框架**：Electron
- **前端框架**：React 18 + TypeScript
- **状态管理**：Redux Toolkit
- **UI 组件库**：Ant Design
- **构建工具**：Vite
- **打包工具**：electron-builder
- **下载引擎**：Aria2
- **视频处理**：FFmpeg
- **CI/CD**：GitHub Actions

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 GPL-3.0-or-later 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情
