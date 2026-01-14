const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const rimraf = require('rimraf');
const { execSync } = require('child_process');

// 读取 .env 文件
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    });
    
    console.log('已加载 .env 文件');
  } else {
    console.log('未找到 .env 文件，使用默认配置');
  }
}

// 设置文件执行权限
function setExecutablePermissions(filePath) {
  try {
    if (process.platform !== 'win32') {
      // Unix-like 系统 (macOS, Linux)
      console.log(`设置执行权限: ${filePath}`);
      execSync(`chmod +x "${filePath}"`);
    }
  } catch (error) {
    console.error(`设置执行权限失败: ${filePath}`, error.message);
  }
}

// 递归设置目录下所有可执行文件的权限
function setBinariesPermissions(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 递归处理子目录
        setBinariesPermissions(fullPath);
      } else if (stat.isFile()) {
        // 检查是否为可执行文件
        const ext = path.extname(item).toLowerCase();
        const basename = path.basename(item, ext);
        
        // 设置常见可执行文件的权限
        const executableNames = ['aria2c', 'ffmpeg', 'ffprobe'];
        const isExecutable = executableNames.includes(basename) || 
                           ext === '' || // Unix 可执行文件通常没有扩展名
                           (process.platform === 'win32' && ext === '.exe');
        
        if (isExecutable) {
          setExecutablePermissions(fullPath);
        }
      }
    });
  } catch (error) {
    console.error('设置二进制文件权限时出错:', error.message);
  }
}

// 加载环境变量
loadEnv();

// 配置参数 - 从环境变量获取BIN_URL
const BIN_URL = process.env.BIN_DOWNLOAD_URL || 'https://github.com/tekintian/double-mouse-downloader/releases/download/v1/win-darwin-bin.zip';

const BIN_DIR = path.join(__dirname, 'bin');
const TEMP_ZIP = path.join(__dirname, 'win-darwin-bin.zip');

async function downloadBin() {
  console.log('开始下载bin目录...');
  console.log('下载URL:', BIN_URL);
  
  if (!BIN_URL || BIN_URL === '') {
    console.error('错误：未设置BIN_DOWNLOAD_URL环境变量或.env文件');
    console.error('请在 .env 文件中添加：BIN_DOWNLOAD_URL=your-download-url');
    console.error('或设置环境变量：export BIN_DOWNLOAD_URL="your-download-url"');
    process.exit(1);
  }
  
  try {
    // 移除旧的bin目录
    if (fs.existsSync(BIN_DIR)) {
      console.log('移除旧的bin目录...');
      rimraf.sync(BIN_DIR);
    }
    
    // 创建新的bin目录
    fs.mkdirSync(BIN_DIR, { recursive: true });
    
    // 下载zip文件
    const response = await axios({
      url: BIN_URL,
      method: 'GET',
      responseType: 'stream',
      timeout: 30000 // 30秒超时
    });
    
    const writer = fs.createWriteStream(TEMP_ZIP);
    response.data.pipe(writer);
    
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    console.log('下载完成，开始解压...');
    
    // 解压zip文件（strip 1 处理）
    const zip = new AdmZip(TEMP_ZIP);
    const entries = zip.getEntries();
    
    // 获取根目录名（strip 1）
    const rootDirs = new Set();
    entries.forEach(entry => {
      const parts = entry.entryName.split('/');
      if (parts.length > 1) {
        rootDirs.add(parts[0]);
      }
    });
    
    if (rootDirs.size === 1) {
      // 只有一个根目录，执行 strip 1
      const rootDir = Array.from(rootDirs)[0];
      console.log(`检测到根目录 "${rootDir}"，执行 strip 1 解压...`);
      
      entries.forEach(entry => {
        if (entry.entryName.startsWith(rootDir + '/')) {
          const newPath = entry.entryName.substring(rootDir.length + 1);
          if (newPath && !entry.isDirectory) {
            const targetPath = path.join(BIN_DIR, newPath);
            const targetDir = path.dirname(targetPath);
            
            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true });
            }
            
            fs.writeFileSync(targetPath, entry.getData());
          }
        }
      });
    } else {
      // 没有单一根目录，直接解压
      console.log('未检测到单一根目录，直接解压...');
      zip.extractAllTo(BIN_DIR, true);
    }
    
    // 删除临时zip文件
    fs.unlinkSync(TEMP_ZIP);
    
    console.log('解压完成！');
    console.log('bin目录已更新：', BIN_DIR);
    
    // 设置二进制文件执行权限
    console.log('正在设置二进制文件执行权限...');
    setBinariesPermissions(BIN_DIR);
    console.log('执行权限设置完成！');
    
  } catch (error) {
    console.error('下载或解压失败：', error.message);
    if (error.code === 'ENOTFOUND') {
      console.error('错误：无法连接到下载服务器，请检查URL是否正确');
    } else if (error.code === 'ECONNABORTED') {
      console.error('错误：下载超时，请检查网络连接');
    }
    process.exit(1);
  }
}

downloadBin();