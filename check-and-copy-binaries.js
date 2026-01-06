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

// 定义项目bin目录路径
const projectBinDir = path.join(__dirname, 'bin', platform, arch);

// 确保项目bin目录存在
if (!fs.existsSync(projectBinDir)) {
  fs.mkdirSync(projectBinDir, { recursive: true });
  console.log(`Created directory: ${projectBinDir}`);
}

// 检查并复制二进制文件
Object.values(binaries).forEach(binaryName => {
  const projectBinaryPath = path.join(projectBinDir, binaryName);

  // 检查项目中是否存在该二进制文件
  if (fs.existsSync(projectBinaryPath)) {
    console.log(`✓ ${binaryName} already exists in project at: ${projectBinaryPath}`);
    return;
  }

  // 从系统中查找二进制文件位置
  let systemBinaryPath;
  try {
    if (platform === 'win32') {
      // 在Windows上使用where命令查找
      systemBinaryPath = execSync(`where ${binaryName}`).toString().trim();
    } else {
      // 在macOS/Linux上使用which命令查找
      systemBinaryPath = execSync(`which ${binaryName}`).toString().trim();
    }

    console.log(`Found ${binaryName} in system at: ${systemBinaryPath}`);

    // 复制文件到项目bin目录
    fs.copyFileSync(systemBinaryPath, projectBinaryPath);

    // 确保文件有执行权限（仅macOS/Linux）
    if (platform !== 'win32') {
      fs.chmodSync(projectBinaryPath, 0o755);
    }

    console.log(`✓ Copied ${binaryName} to project at: ${projectBinaryPath}`);
  } catch (error) {
    console.error(`✗ Failed to find or copy ${binaryName}: ${error.message}`);
  }
});

console.log('\n检查和复制二进制文件完成！');