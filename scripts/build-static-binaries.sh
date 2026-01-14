#!/bin/bash
# 构建静态链接的 ffmpeg 和 aria2 二进制文件
# 支持 macOS, Linux, Windows

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 获取平台和架构
PLATFORM="${1:-$(uname -s | tr '[:upper:]' '[:lower:]')}"
ARCH="${2:-$(uname -m)}"

# 转换架构名称
case "$ARCH" in
    x86_64)
        ARCH="x64"
        ;;
    aarch64|arm64)
        ARCH="arm64"
        ;;
    i386|i686)
        ARCH="ia32"
        ;;
esac

# 转换平台名称
case "$PLATFORM" in
    darwin)
        PLATFORM="darwin"
        ;;
    linux)
        PLATFORM="linux"
        ;;
    windows|win32|mingw*|msys*)
        PLATFORM="win32"
        ;;
esac

log_info "平台: $PLATFORM"
log_info "架构: $ARCH"
log_info "构建目录: $(pwd)"

# 输出目录
OUTPUT_DIR="$(pwd)/bin/${PLATFORM}/${ARCH}"
mkdir -p "$OUTPUT_DIR"

log_info "输出目录: $OUTPUT_DIR"

# 创建临时构建目录
BUILD_DIR="$(pwd)/.build-temp"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# ============================================
# 函数: 下载并解压源代码
# ============================================
download_source() {
    local name="$1"
    local url="$2"
    local dir="$3"

    if [ -d "$dir" ]; then
        log_info "$name 源码已存在，跳过下载"
        return 0
    fi

    log_info "下载 $name 源码..."
    
    local filename=$(basename "$url")
    if [ ! -f "$filename" ]; then
        curl -L -o "$filename" "$url" || {
            log_error "下载 $name 源码失败"
            exit 1
        }
    fi

    log_info "解压 $name 源码..."
    tar -xzf "$filename" || {
        log_error "解压 $name 源码失败"
        exit 1
    }

    log_info "$name 源码准备完成"
}

# ============================================
# 函数: 编译 ffmpeg 静态库
# ============================================
build_ffmpeg() {
    log_info "=== 开始编译 ffmpeg ==="

    local FFmpeg_VERSION="6.0"
    local FFmpeg_URL="https://ffmpeg.org/releases/ffmpeg-${FFmpeg_VERSION}.tar.gz"
    local FFmpeg_DIR="ffmpeg-${FFmpeg_VERSION}"

    download_source "ffmpeg" "$FFmpeg_URL" "$FFmpeg_DIR"

    cd "$FFmpeg_DIR"

    # 配置选项 - 静态编译，只包含必要的组件
    local FFmpeg_CONFIG_FLAGS="--enable-static --disable-shared"

    # 平台特定配置
    case "$PLATFORM" in
        darwin)
            FFmpeg_CONFIG_FLAGS="$FFmpeg_CONFIG_FLAGS --arch=${ARCH}"
            if [ "$ARCH" = "arm64" ]; then
                FFmpeg_CONFIG_FLAGS="$FFmpeg_CONFIG_FLAGS --enable-cross-compile --target-os=darwin --cc=clang --cxx=clang++ --extra-cflags='-target arm64-apple-macos10.13' --extra-ldflags='-target arm64-apple-macos10.13'"
            fi
            ;;
        linux)
            FFmpeg_CONFIG_FLAGS="$FFmpeg_CONFIG_FLAGS --enable-cross-compile"
            if [ "$ARCH" = "arm64" ]; then
                FFmpeg_CONFIG_FLAGS="$FFmpeg_CONFIG_FLAGS --arch=aarch64 --target-os=linux"
            else
                FFmpeg_CONFIG_FLAGS="$FFmpeg_CONFIG_FLAGS --arch=x86_64 --target-os=linux"
            fi
            ;;
        win32)
            # Windows 需要特殊的配置，这里使用预编译的静态版本
            log_warn "Windows 平台建议使用预编译的静态 ffmpeg"
            log_warn "下载地址: https://www.gyan.dev/ffmpeg/builds/"
            return 0
            ;;
    esac

    # 最小化配置
    FFmpeg_CONFIG_FLAGS="$FFmpeg_CONFIG_FLAGS \
        --disable-doc \
        --disable-htmlpages \
        --disable-manpages \
        --disable-podpages \
        --disable-txtpages \
        --disable-debug \
        --disable-programs \
        --disable-avdevice \
        --disable-swresample \
        --disable-swscale \
        --disable-postproc \
        --disable-avfilter \
        --disable-network \
        --disable-encoders \
        --disable-muxers \
        --enable-encoder=aac \
        --enable-muxer=mp4 \
        --enable-muxer=webm \
        --enable-decoders \
        --enable-demuxers \
        --enable-parser=aac \
        --enable-parser=h264 \
        --enable-parser=hevc \
        --enable-protocol=file,http,https \
        --enable-libx264 \
        --enable-gpl"

    log_info "配置 ffmpeg..."
    log_info "配置选项: $FFmpeg_CONFIG_FLAGS"

    ./configure $FFmpeg_CONFIG_FLAGS || {
        log_error "ffmpeg 配置失败"
        log_warn "尝试使用默认配置..."
        ./configure --enable-static --disable-shared --disable-doc
    }

    log_info "编译 ffmpeg..."
    make -j$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4) || {
        log_error "ffmpeg 编译失败"
        exit 1
    }

    # 复制 ffmpeg 可执行文件
    cp ffmpeg "$OUTPUT_DIR/"
    chmod +x "$OUTPUT_DIR/ffmpeg"

    log_info "ffmpeg 编译完成: $OUTPUT_DIR/ffmpeg"
    
    cd ..
}

# ============================================
# 函数: 编译 aria2 静态库
# ============================================
build_aria2() {
    log_info "=== 开始编译 aria2 ==="

    local Aria2_VERSION="1.37.0"
    local Aria2_URL="https://github.com/aria2/aria2/releases/download/release-${Aria2_VERSION}/aria2-${Aria2_VERSION}.tar.gz"
    local Aria2_DIR="aria2-${Aria2_VERSION}"

    download_source "aria2" "$Aria2_URL" "$Aria2_DIR"

    cd "$Aria2_DIR"

    # 配置选项 - 静态编译
    local Aria2_CONFIG_FLAGS="--enable-static --disable-shared --without-libxml2 --without-libexpat --disable-ssl"

    # 平台特定配置
    case "$PLATFORM" in
        darwin)
            if [ "$ARCH" = "arm64" ]; then
                Aria2_CONFIG_FLAGS="$Aria2_CONFIG_FLAGS --host=aarch64-apple-darwin CC='clang -target arm64-apple-macos10.13' CXX='clang++ -target arm64-apple-macos10.13'"
            fi
            ;;
        linux)
            if [ "$ARCH" = "arm64" ]; then
                Aria2_CONFIG_FLAGS="$Aria2_CONFIG_FLAGS --host=aarch64-linux-gnu"
            fi
            ;;
    esac

    log_info "配置 aria2..."
    ./configure $Aria2_CONFIG_FLAGS || {
        log_error "aria2 配置失败"
        log_warn "尝试使用默认配置..."
        ./configure --enable-static --disable-shared
    }

    log_info "编译 aria2..."
    make -j$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4) || {
        log_error "aria2 编译失败"
        exit 1
    }

    # 复制 aria2c 可执行文件
    cp src/aria2c "$OUTPUT_DIR/"
    chmod +x "$OUTPUT_DIR/aria2c"

    log_info "aria2 编译完成: $OUTPUT_DIR/aria2c"
    
    cd ..
}

# ============================================
# 主执行流程
# ============================================
case "$PLATFORM" in
    win32)
        log_warn "Windows 平台建议使用预编译的静态二进制文件"
        log_warn "ffmpeg: https://www.gyan.dev/ffmpeg/builds/"
        log_warn "aria2: https://github.com/aria2/aria2/releases"
        
        # 检查是否已存在二进制文件
        if [ -f "$OUTPUT_DIR/ffmpeg.exe" ] && [ -f "$OUTPUT_DIR/aria2c.exe" ]; then
            log_info "Windows 二进制文件已存在"
        else
            log_error "Windows 二进制文件不存在，请手动下载并放置到 $OUTPUT_DIR/"
            exit 1
        fi
        ;;
    darwin|linux)
        # Unix-like 系统，尝试编译
        build_ffmpeg
        build_aria2
        ;;
    *)
        log_error "不支持的平台: $PLATFORM"
        exit 1
        ;;
esac

# 清理临时文件
cd ..
rm -rf "$BUILD_DIR"

log_info "=== 构建完成 ==="
log_info "输出目录: $OUTPUT_DIR"
log_info "包含的文件:"
ls -lh "$OUTPUT_DIR" || true

log_info "文件大小:"
du -sh "$OUTPUT_DIR"/{ffmpeg,aria2c} 2>/dev/null || true
