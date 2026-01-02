# AiNote 启动脚本使用指南

## 📋 脚本列表

项目根目录下提供了以下管理脚本：

| 脚本文件 | 功能描述 |
|---------|---------|
| `start.sh` | 启动后端和前端服务 |
| `stop.sh` | 停止所有服务 |
| `restart.sh` | 重启所有服务 |
| `status.sh` | 查看服务运行状态 |

## 🚀 快速开始

### 1. 启动服务

```bash
./start.sh
```

**功能说明：**
- ✅ 自动检查端口 3001（后端）和 5173（前端）是否被占用
- ✅ 如果端口被占用，自动停止相关进程
- ✅ 检查并初始化数据库（如果不存在）
- ✅ 生成 Prisma Client
- ✅ 启动后端服务
- ✅ 启动前端服务
- ✅ 显示访问地址和演示账号

**输出示例：**
```
╔════════════════════════════════════════╗
║         AiNote 启动脚本 🚀            ║
╚════════════════════════════════════════╝

[STEP] 检查端口占用情况...
[SUCCESS] 后端端口 3001 可用
[SUCCESS] 前端端口 5173 可用

[STEP] 启动后端服务...
[INFO] 启动后端服务器 (端口 3001)...
[SUCCESS] 后端服务启动成功 (PID: 12345)
[INFO] 后端地址: http://localhost:3001
[INFO] 日志文件: /Users/xxx/AiNote/logs/backend.log

[STEP] 启动前端服务...
[INFO] 启动前端服务器 (端口 5173)...
[SUCCESS] 前端服务启动成功 (PID: 12346)
[INFO] 前端地址: http://localhost:5173
[INFO] 日志文件: /Users/xxx/AiNote/logs/frontend.log

╔════════════════════════════════════════╗
║     AiNote 服务启动成功! 🎉           ║
╚════════════════════════════════════════╝

📱 前端地址:     http://localhost:5173
🔧 后端地址:     http://localhost:3001
📊 API 地址:     http://localhost:3001/api/v1
💾 数据库:       PostgreSQL (localhost:5432/ainote)

📋 演示账号:
   邮箱: demo@ainote.com
   密码: demo123456

📝 日志文件:
   后端: tail -f logs/backend.log
   前端: tail -f logs/frontend.log

⏹  停止服务: ./stop.sh
```

### 2. 查看服务状态

```bash
./status.sh
```

**显示信息：**
- 服务运行状态（进程 PID、运行时间）
- 端口监听状态
- 后端健康检查结果
- 日志文件信息（大小、行数）
- 数据库状态

### 3. 停止服务

```bash
./stop.sh
```

**功能说明：**
- 从 PID 文件读取进程 ID 并停止
- 通过端口检查并停止残留进程
- 清理所有相关 Node.js 进程

### 4. 重启服务

```bash
./restart.sh
```

**功能说明：**
- 先执行 `stop.sh` 停止服务
- 等待 2 秒
- 再执行 `start.sh` 启动服务

## 📁 日志文件

所有日志文件存储在 `logs/` 目录：

| 日志文件 | 说明 |
|---------|------|
| `logs/backend.log` | 后端服务日志 |
| `logs/frontend.log` | 前端服务日志 |
| `logs/backend.pid` | 后端进程 PID |
| `logs/frontend.pid` | 前端进程 PID |

### 查看实时日志

```bash
# 查看后端日志
tail -f logs/backend.log

# 查看前端日志
tail -f logs/frontend.log

# 同时查看两个日志
tail -f logs/backend.log logs/frontend.log
```

## 🔧 常见问题

### 端口被占用怎么办？

`start.sh` 脚本会自动处理端口占用问题，无需手动干预。

如果仍然失败，可以手动停止进程：

```bash
# 停止后端（端口 3001）
lsof -ti :3001 | xargs kill -9

# 停止前端（端口 5173）
lsof -ti :5173 | xargs kill -9
```

### 数据库丢失怎么办？

重新运行启动脚本，会自动检测并初始化数据库：

```bash
./start.sh
```

或手动执行：

```bash
cd packages/backend
npm run prisma:migrate
npm run prisma:seed
```

### 如何查看详细错误信息？

查看日志文件：

```bash
# 后端日志
cat logs/backend.log

# 前端日志
cat logs/frontend.log
```

或使用 `./status.sh` 查看服务状态。

## 🎯 开发工作流

### 日常开发

```bash
# 1. 启动服务
./start.sh

# 2. 开发中查看状态
./status.sh

# 3. 如需重启
./restart.sh

# 4. 结束开发
./stop.sh
```

### 仅启动后端

```bash
cd packages/backend
npm run dev
```

### 仅启动前端

```bash
cd packages/frontend
npm run dev
```

## 📊 端口说明

| 服务 | 端口 | 用途 |
|------|------|------|
| 后端 | 3001 | API 服务器 |
| 前端 | 5173 | Vite 开发服务器 |

## 🔐 演示账号

```
邮箱：demo@ainote.com
密码：demo123456
```

## 📝 注意事项

1. **首次运行**：首次运行会自动创建数据库和种子数据
2. **端口占用**：脚本会自动处理端口占用，无需手动操作
3. **日志管理**：日志文件会持续增长，定期清理
4. **进程清理**：使用 `./stop.sh` 确保所有进程被正确停止

## 🛠️ 技术细节

### PID 管理

脚本使用 PID 文件管理进程：
- `logs/backend.pid` - 后端进程 ID
- `logs/frontend.pid` - 前端进程 ID

停止服务时，脚本会：
1. 读取 PID 文件
2. 优雅停止进程（SIGTERM）
3. 等待 2 秒
4. 如果进程仍在运行，强制停止（SIGKILL）
5. 删除 PID 文件

### 端口检测

使用 `lsof` 命令检测端口占用：

```bash
lsof -Pi :3001 -sTCP:LISTEN -t
```

### 健康检查

后端提供健康检查接口：

```bash
curl http://localhost:3001/health
```

返回：
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📞 获取帮助

如有问题，请查看：
- 日志文件：`logs/*.log`
- 服务状态：`./status.sh`
- README.md：项目文档
