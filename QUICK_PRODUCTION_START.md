# 快速开始 - 生产部署

## 第一次部署（3 步）

### 1. 一键启动生产服务

双击运行：
```
start-production.bat
```

等待完成后，你会看到：
- ✅ 后端 API 运行在：http://localhost:3001
- ✅ 前端已构建完成

### 2. 启动前端服务

双击运行：
```
start-frontend-simple.bat
```

前端将运行在：http://localhost:3100

### 3. 访问应用

打开浏览器访问：http://localhost:3100

**默认账号**：
- 邮箱：demo@ainote.com
- 密码：demo123456

## 日常使用

### 启动服务
```bash
start-production.bat
start-frontend-simple.bat
```

### 停止服务
```bash
stop-production.bat
```

### 查看日志
```bash
pm2 logs ainote-backend
```

### 重启后端
```bash
pm2 restart ainote-backend
```

## 更新应用

1. 停止服务：`stop-production.bat`
2. 拉取代码：`git pull`
3. 重新部署：`start-production.bat`

## 生产 vs 开发

| 特性 | 开发模式 (restart.bat) | 生产模式 (start-production.bat) |
|------|----------------------|-------------------------------|
| 前端 | Vite Dev Server (热重载) | 静态文件 (优化后) |
| 后端 | tsx watch (实时编译) | 构建后的 JS 文件 |
| 性能 | 较慢 | 快 |
| 内存占用 | 较高 | 较低 |
| 适用场景 | 开发调试 | 生产环境 |

## 推荐使用

- **开发时**：使用 `restart.bat`
- **测试/演示**：使用 `start-production.bat`
- **正式上线**：配置 IIS/Nginx + PM2

详细文档：[PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md)
