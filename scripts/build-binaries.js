const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 获取平台和架构
const platform = process.platform;
const arch = process.arch;

// 转换架构名称
let targetArch = arch;
if (arch === 'x64') targetArch = 'x64';
else if (arch === 'arm64') targetArch = 'arm64';
else if (arch === 'ia32') targetArch = 'ia32';

// 输出目录
const outputDir = path.join(__dirname, '..', 'bin', platform, targetArch);

// 检查二进制文件是否已存在
function checkBinariesExist() {
  const ffmpegPath = path.join(outputDir, platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  const aria2cPath = path.join(outputDir, platform === 'win32' ? 'aria2c.exe' : 'aria2c');

  const ffmpegExists = fs.existsSync(ffmpegPath);
  const aria2cExists = fs.existsSync(aria2cPath);

  if (ffmpegExists && aria2cExists) {
    console.log(`\n✓ 静态二进制文件已存在,跳过构建`);
    console.log(`  - ${ffmpegPath}`);
    console.log(`  - ${aria2cPath}\n`);
    return true;
  }

  return false;
}

console.log(`\n平台: ${platform}`);
console.log(`架构: ${targetArch}\n`);

try {
  // 检查是否已存在
  if (checkBinariesExist()) {
    process.exit(0);
  }

  // 不存在则构建
  if (platform === 'win32') {
    console.log('使用 PowerShell 脚本构建 Windows 二进制文件...');
    const scriptPath = path.join(__dirname, 'build-static-binaries.ps1');
    execSync(
      `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`,
      { stdio: 'inherit' }
    );
  } else {
    console.log('使用 Bash 脚本构建 Unix 二进制文件...');
    const scriptPath = path.join(__dirname, 'build-static-binaries.sh');
    execSync(
      `bash "${scriptPath}" ${platform} ${targetArch}`,
      { stdio: 'inherit' }
    );
  }

  console.log('\n✓ 二进制文件构建完成!\n');
} catch (error) {
  console.error('\n✗ 二进制文件构建失败:', error.message);
  process.exit(1);
}
