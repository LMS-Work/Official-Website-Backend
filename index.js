const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

// Load environment variables and create .env if it doesn't exist
const envPath = path.resolve(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  const defaultEnv = 'REACT_APP_ADMIN_PASSWORD=admin\nPORT=5000';
  fs.writeFileSync(envPath, defaultEnv);
  console.log('Created new .env file with default values');
}
dotenv.config({ path: envPath });

// ASCII art for console
console.log(`
  _______    _____   ____  
 |__   __|  / ____| |  _ \\ 
    | |    | |      | |_) |
    | |    | |      |  _ < 
    | |    | |____  | |_) |
    |_|     \\_____| |____/ 
                           
                           
服务器启动中...
`);

console.log('\n=== 系统信息 ===');
console.log(`运行环境: ${process.env.NODE_ENV || 'development'}`);
console.log(`启动时间: ${new Date().toLocaleString()}`);
console.log(`系统平台: ${process.platform}`);
console.log(`Node版本: ${process.version}`);
console.log('\n=== 服务配置 ===');
console.log(`服务端口: ${process.env.PORT || 5000}`);
console.log(`WebSocket: 已启用`);
console.log(`CORS: 已启用`);
console.log('\n=== API端点 ===');
console.log('POST /login     - 管理员登录');
console.log('POST /logout    - 管理员登出');
console.log('GET  /public-env - 获取公开配置');
console.log('GET  /env       - 获取完整配置（需要认证）');
console.log('\n=== 启动完成 ===\n');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

// Endpoint to update .env file
app.post('/update-env', (req, res) => {
  const envPath = path.resolve(__dirname, '.env');
  const newEnv = req.body;

  const envContent = Object.keys(newEnv)
    .map(key => `${key}=${newEnv[key]}`)
    .join('\n');

  fs.writeFile(envPath, envContent, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update .env file' });
    }
    res.json({ message: 'Successfully updated .env file' });
  });
});

// Helper function to filter sensitive data
function filterSensitiveData(env, isAdmin = false) {
  const filtered = { ...env };
  const sensitiveKeys = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN'];
  const publicKeys = [
    // 服务器基础信息
    'REACT_APP_LOGO_URL',
    'REACT_APP_SERVER_NAME',
    'REACT_APP_START_TIME',
    // 服务器地址信息
    'REACT_APP_IPV4_ADDRESS',
    'REACT_APP_IPV6_ADDRESS',
    'REACT_APP_BACKUP_ADDRESS',
    'REACT_APP_BEDROCK_ADDRESS',
    'REACT_APP_OVERSEAS_ADDRESS',
    // 界面配置
    'REACT_APP_TYPEWRITER_WORDS',
    // 社交媒体链接
    'REACT_APP_GITHUB_LINK',
    'REACT_APP_BILIBILI_LINK',
    'REACT_APP_QQ_LINK',
    'REACT_APP_EMAIL_LINK',
    // 其他信息
    'REACT_APP_BEIAN',
    // 环境变量
    'NODE_ENV',
    'PORT'
  ];
  
  if (!isAdmin) {
    // 非管理员只保留 publicKeys 中列出的键
    Object.keys(filtered).forEach(key => {
      if (!publicKeys.includes(key)) {
        delete filtered[key];
      }
    });
  } else {
    // 管理员可以看到所有键，但敏感信息会被隐藏
    Object.keys(filtered).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toUpperCase().includes(sensitive))) {
        filtered[key] = '******';
      }
    });
  }

  return filtered;
}

// 公开的环境变量接口
app.get('/public-env', (req, res) => {
  try {
    const envData = filterSensitiveData(process.env, false);
    console.log('\n=== 公开环境变量请求 ===');
    console.log(`请求时间: ${new Date().toLocaleString()}`);
    console.log(`请求IP: ${req.ip}`);

    // 确保所有必需的数据都存在
    if (Object.keys(envData).length === 0) {
      console.warn('警告: 未找到任何公开环境变量');
    }

    res.json({ 
      success: true, 
      data: envData,
      message: '获取公开配置成功'
    });
  } catch (error) {
    console.error('获取公开环境变量失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取配置失败'
    });
  }
});

// 需要认证的完整环境变量接口
app.get('/env', authenticateAdmin, (req, res) => {
  try {
    const envData = filterSensitiveData(process.env, true);
    console.log('\n=== 完整环境变量请求 ===');
    console.log(`请求时间: ${new Date().toLocaleString()}`);
    console.log(`请求IP: ${req.ip}`);
    res.json({ 
      success: true, 
      data: envData,
      message: '获取完整配置成功'
    });
  } catch (error) {
    console.error('获取环境变量失败:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取配置失败' 
    });
  }
});

// Authentication middleware
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('\n=== 未授权访问 ===');
    console.log(`访问时间: ${new Date().toLocaleString()}`);
    console.log(`访问IP: ${req.ip}`);
    return res.status(401).json({ success: false, message: '需要认证' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    next();
  } catch (error) {
    console.log('\n=== 认证失败 ===');
    console.log(`失败时间: ${new Date().toLocaleString()}`);
    console.log(`访问IP: ${req.ip}`);
    return res.status(403).json({ success: false, message: '认证失败' });
  }
}

// 添加 JWT token 生成函数
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'default-secret', { 
    expiresIn: '24h',
    algorithm: 'HS256'
  });
}

// 修改登录接口
app.post('/login', (req, res) => {
  console.log('\n=== 登录请求 ===');
  console.log(`请求时间: ${new Date().toLocaleString()}`);
  console.log(`请求IP: ${req.ip}`);

  const { password } = req.body;

  // 验证请求体
  if (!password) {
    console.log('登录失败: 密码为空');
    return res.status(400).json({
      success: false,
      message: '请提供密码'
    });
  }

  // 验证密码
  if (password === process.env.REACT_APP_ADMIN_PASSWORD) {
    const token = generateToken({ 
      role: 'admin',
      iat: Date.now(),
      ip: req.ip
    });

    console.log('登录成功');
    res.json({ 
      success: true,
      message: '登录成功',
      token: token,
      expiresIn: 24 * 60 * 60 * 1000 // 24小时的毫秒数
    });
  } else {
    console.log('登录失败: 密码错误');
    res.status(401).json({ 
      success: false,
      message: '密码错误' 
    });
  }
});

// 添加登出接口
app.post('/logout', authenticateAdmin, (req, res) => {
  console.log('\n=== 登出请求 ===');
  console.log(`请求时间: ${new Date().toLocaleString()}`);
  console.log(`请求IP: ${req.ip}`);
  
  res.json({
    success: true,
    message: '登出成功'
  });
});

// WebSocket server setup
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('message', (message) => {
    console.log(`Received: ${message}`);
  });
  ws.send('Hello from server');
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
