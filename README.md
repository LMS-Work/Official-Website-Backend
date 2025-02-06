# TCB 官方网站后端

TCB 官方网站的后端服务器，提供环境变量配置和 WebSocket 支持。

## 功能特性

### 环境变量管理
- 支持公开配置获取
- 管理员配置管理（需要认证）
- 敏感信息自动过滤

### WebSocket 服务
- 实时数据推送
- 自动重连机制
- 连接状态监控

### 安全特性
- JWT 身份验证
- 密码加密存储
- CORS 安全配置

## API 接口

### 公开接口
- `GET /public-env` - 获取公开配置
  - 服务器基本信息
  - 服务器地址信息
  - 社交媒体链接
  - 界面配置等

### 认证接口
- `POST /login` - 管理员登录
- `POST /logout` - 管理员登出
- `GET /env` - 获取完整配置（需要认证）

## 环境变量配置

### 基础配置
- `PORT` - 服务器端口
- `NODE_ENV` - 运行环境

### 服务器信息
- `REACT_APP_SERVER_NAME` - 服务器名称
- `REACT_APP_LOGO_URL` - 服务器 Logo
- `REACT_APP_START_TIME` - 开服时间

### 服务器地址
- `REACT_APP_IPV4_ADDRESS` - IPv4 地址
- `REACT_APP_IPV6_ADDRESS` - IPv6 地址
- `REACT_APP_BACKUP_ADDRESS` - 备用地址
- `REACT_APP_BEDROCK_ADDRESS` - 基岩版地址
- `REACT_APP_OVERSEAS_ADDRESS` - 海外地址

### 界面配置
- `REACT_APP_TYPEWRITER_WORDS` - 打字机文字效果

### 社交媒体
- `REACT_APP_GITHUB_LINK` - GitHub 链接
- `REACT_APP_BILIBILI_LINK` - BiliBili 链接
- `REACT_APP_QQ_LINK` - QQ 群链接
- `REACT_APP_EMAIL_LINK` - 邮箱联系方式

### 其他信息
- `REACT_APP_BEIAN` - 备案信息

## 技术栈
- Node.js
- Express
- WebSocket
- JWT
- dotenv

## 开发团队
- TCB 开发团队

## 许可证
本项目采用 MIT 许可证
