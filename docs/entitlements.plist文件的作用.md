
# entitlements.plist文件的作用

entitlements.plist文件是macOS应用程序的权限配置文件，用于控制应用程序在macOS系统中的权限，特别是在使用**Hardened Runtime**（强化运行时）时。强化运行时是macOS的一项安全功能，它限制了应用程序的某些能力，提高了应用程序的安全性。

## 正确配置步骤

1. **移动entitlements.plist文件**

   首先，需要将entitlements.plist文件从`.github/workflows/`目录移动到项目根目录，因为electron-builder需要在根目录找到它：

   ```bash
   mv .github/workflows/entitlements.plist .
   ```

2. **修改electron-builder.yml文件**

   接下来，需要在electron-builder.yml文件中添加macOS配置，引用entitlements.plist文件：

   ```yaml /Volumes/data/projects/frontend_project/double-mouse-downloader/electron-builder.yml
   appId: 'moe.moyu.double-mouse-downloader'
   productName: 鼠鼠下载器

   win:
     target:
       - target: nsis
         arch:
           - x64
       - target: 7z
         arch:
           - x64

   mac:
     target:
       - target: dmg
         arch:
           - x64
           - arm64
       - target: zip
         arch:
           - x64
           - arm64
     minimumSystemVersion: '10.15'
     hardenedRuntime: true
     entitlements: entitlements.plist
     entitlementsInherit: entitlements.plist

   directories:
     buildResources: ./build-resources

   nsis:
     oneClick: false
     allowToChangeInstallationDirectory: true
     installerLanguages: 'zh_CN'
     language: '2052'

   files:
     - ./build/**/*

   extraResources:
     - ./bin/${platform}/${arch}/*
   ```

3. **配置GitHub Actions构建**

   最后，需要确保GitHub Actions配置正确使用这些设置。我们已经在之前的修改中添加了必要的环境变量，所以不需要进一步修改build.yml文件。

## 关于entitlements.plist文件内容的说明

您的entitlements.plist文件包含了以下权限配置：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>com.apple.security.app-sandbox</key>
    <false/>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.debugger</key>
    <false/>
  </dict>
</plist>
```

这些配置的含义是：

- `com.apple.security.app-sandbox`: 设置为false，表示不启用沙盒模式
- `com.apple.security.cs.allow-jit`: 设置为true，允许应用程序使用即时编译
- `com.apple.security.cs.allow-unsigned-executable-memory`: 设置为true，允许应用程序使用未签名的可执行内存
- `com.apple.security.cs.debugger`: 设置为false，不允许应用程序被调试

这些配置适合您的应用程序，因为它需要运行外部二进制文件（如aria2c和ffmpeg），所以不适合启用沙盒模式。

完成这些配置后，您的应用程序将能够在macOS 10.15及以上版本上运行，并同时支持Intel（x64）和Apple Silicon（arm64）架构。
