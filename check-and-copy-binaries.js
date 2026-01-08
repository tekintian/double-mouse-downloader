const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 获取当前平台和架构
const platform = process.platform;
const arch = process.arch;

// 定义二进制文件名
const binaries = {
  aria2c: platform === 'win32' ? 'aria2c.exe' : 'aria2c',
  ffmpeg: platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
};

// 定义平台显示名称
const platformNames = {
  win32: 'Windows',
  darwin: 'macOS',
  linux: 'Linux'
};

// 定义项目bin目录路径
const projectBinDir = path.join(__dirname, 'bin', platform, arch);

// 确保项目bin目录存在
if (!fs.existsSync(projectBinDir)) {
  fs.mkdirSync(projectBinDir, { recursive: true });
  console.log(`✓ 创建目录: ${projectBinDir}`);
}

console.log(`\n平台: ${platformNames[platform] || platform}`);
console.log(`架构: ${arch}\n`);

// 检查文件是否是LFS指针
function isLfsPointer(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.startsWith('version https://git-lfs.github.com/spec/v1');
  } catch (error) {
    return false;
  }
}

// 从LFS拉取真实文件
function pullLfsFile(filePath) {
  try {
    console.log(`⚠ 检测到LFS指针: ${filePath}`);
    console.log(`   正在从LFS拉取真实文件...`);
    execSync(`git lfs pull --include="bin/${platform}/${arch}/*"`, {
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    // 验证文件是否不再是LFS指针
    if (isLfsPointer(filePath)) {
      console.error(`✗ LFS拉取失败，文件仍然是LFS指针`);
      return false;
    }
    
    console.log(`✓ LFS文件拉取成功: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`✗ LFS拉取失败: ${error.message}`);
    return false;
  }
}

// 检查并复制二进制文件
Object.values(binaries).forEach(binaryName => {
  const projectBinaryPath = path.join(projectBinDir, binaryName);

  // 检查项目中是否存在该二进制文件
  if (fs.existsSync(projectBinaryPath)) {
    // 检查是否是LFS指针
    if (isLfsPointer(projectBinaryPath)) {
      const pulled = pullLfsFile(projectBinaryPath);
      if (!pulled) {
        console.error(`✗ ${binaryName} 是LFS指针且无法拉取真实文件`);
        console.error(`   请确保git-lfs已正确安装和配置`);
        return;
      }
    }
    
    // 验证文件大小是否合理
    const stats = fs.statSync(projectBinaryPath);
    const sizeKB = stats.size / 1024;
    
    if (sizeKB < 100) {
      console.warn(`⚠ ${binaryName} 文件大小异常小 (${sizeKB.toFixed(2)}KB)，可能不是完整的二进制文件`);
    } else {
      console.log(`✓ ${binaryName} 已存在 (${(sizeKB/1024).toFixed(2)}MB): ${projectBinaryPath}`);
    }
    return;
  }

  // 从系统中查找二进制文件位置
  let systemBinaryPath;
  try {
    if (platform === 'win32') {
      // 在Windows上使用where命令查找
      systemBinaryPath = execSync(`where ${binaryName}`, { encoding: 'utf8' }).toString().trim();
    } else {
      // 在macOS/Linux上使用which命令查找
      systemBinaryPath = execSync(`which ${binaryName}`, { encoding: 'utf8' }).toString().trim();
    }

    console.log(`在系统中找到 ${binaryName}: ${systemBinaryPath}`);

    // 复制文件到项目bin目录
    fs.copyFileSync(systemBinaryPath, projectBinaryPath);

    // 确保文件有执行权限（仅macOS/Linux）
    if (platform !== 'win32') {
      fs.chmodSync(projectBinaryPath, 0o755);
    }

    console.log(`✓ 已复制 ${binaryName} 到项目: ${projectBinaryPath}`);
  } catch (error) {
    console.error(`✗ 未找到或无法复制 ${binaryName}: ${error.message}`);
    const installHints = {
      win32: '请从 https://www.gyan.dev/ffmpeg/builds/ 下载 ffmpeg.exe，并添加到系统 PATH',
      darwin: '请使用 brew 安装: brew install aria2 ffmpeg',
      linux: '请使用包管理器安装:\n' +
             '  Ubuntu/Debian: sudo apt-get install aria2 ffmpeg\n' +
             '  CentOS/RHEL: sudo yum install aria2 ffmpeg\n' +
             '  Arch Linux: sudo pacman -S aria2 ffmpeg'
    };
    console.error(`   提示: ${installHints[platform] || '请安装 aria2 和 ffmpeg'}`);
  }
});

console.log('\n✓ 二进制文件检查完成！');
console.log(`  平台: ${platformNames[platform] || platform}`);
console.log(`  架构: ${arch}\n`);