# AiNote 服务启动脚本使用指南

## 📋 概述

本项目提供了智能的启动/停止脚本,支持自动检测端口占用、清理进程、局域网访问等功能。

## 🎯 支持的平台

- ✅ **Windows** (CMD/BAT)
- ✅ **Windows** (Git Bash/MSYS)
- ✅ **Linux**
- ✅ **macOS**

## 🚀 快速开始

### Windows 用户

#### 方法 1: 使用批处理脚本 (推荐)

```cmd
# 启动所有服务
restart.bat

# 或者分别执行
start.bat  # 启动服务
stop.bat   # 停止服务
```

#### 方法 2: 使用 Git Bash

```bash
# 启动所有服务
./restart.sh

# 或者分别执行
./start.sh  # 启动服务
./stop.sh   # 停止服务
```

### Linux/macOS 用户

```bash
# 启动所有服务
./restart.sh

# 或者分别执行
./start.sh  # 启动服务
./stop.sh   # 停止服务
```

## 📦 脚本功能

### restart.bat / restart.sh

一键重启所有服务,自动处理端口占用。

**功能特性:**
- ✅ 自动检测并停止占用端口的进程
- ✅ 智能启动后端和前端服务
- ✅ 自动生成 Prisma Client
- ✅ 显示本地和局域网访问地址
- ✅ 彩色日志输出,易于查看

**端口配置:**
- 后端: `3001`
- 前端: `3100`
- Prisma Studio: `5555`

### start.sh

启动所有服务,包含详细的步骤提示。

**启动流程:**
1. 检查端口占用情况
2. 清理被占用的端口
3. 启动后端服务 (端口 3001)
4. 启动前端服务 (端口 3100, 监听 0.0.0.0)
5. 启动 Prisma Studio (端口 5555)
6. 显示访问信息

### stop.sh / stop.bat

停止所有服务,清理相关进程。

**停止流程:**
1. 从 PID 文件停止服务
2. 通过端口检查并停止服务
3. 清理所有相关进程
4. 删除 PID 文件

## 🌐 局域网访问

脚本会自动显示局域网访问地址,例如:

```
📱 本地访问:
   前端: http://localhost:3100
   后端: http://localhost:3001
   API:  http://localhost:3001/api/v1

🌐 局域网访问:
   前端: http://192.168.1.100:3100
   后端: http://192.168.1.100:3001
   API:  http://192.168.1.100:3001/api/v1
```

### Windows 防火墙设置

如果局域网无法访问,需要允许防火墙:

1. 打开 **Windows Defender 防火墙**
2. 点击 **高级设置**
3. 点击 **入站规则** → **新建规则**
4. 选择 **端口** → **TCP**
5. 输入端口: `3100, 3001`
6. 选择 **允许连接**
7. 勾选所有配置文件
8. 命名规则: `AiNote`

### Linux/macOS 防火墙设置

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 3100/tcp
sudo ufw allow 3001/tcp

# CentOS/RHEL (firewalld)
sudo firewall-cmd --add-port=3100/tcp --permanent
sudo firewall-cmd --add-port=3001/tcp --permanent
sudo firewall-cmd --reload

# macOS
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/bin/node
```

## 📝 日志文件

所有服务的日志都保存在 `logs/` 目录:

```
logs/
├── backend.log      # 后端服务日志
├── frontend.log     # 前端服务日志
├── prisma.log       # Prisma Studio 日志
├── backend.pid      # 后端进程 PID
├── frontend.pid     # 前端进程 PID
└── prisma.pid       # Prisma 进程 PID
```

### 查看日志

```bash
# 实时查看后端日志
tail -f logs/backend.log

# 实时查看前端日志
tail -f logs/frontend.log

# Windows PowerShell
Get-Content logs\backend.log -Wait
Get-Content logs\frontend.log -Wait
```

## 🔧 故障排查

### 问题 1: 端口已被占用

**错误信息:**
```
检测到端口 3001 被占用
```

**解决方案:**
- 脚本会自动停止占用端口的进程
- 如果自动停止失败,手动执行 `stop.bat` 或 `stop.sh`
- Windows 用户可以手动停止:
  ```cmd
  netstat -ano | findstr :3001
  taskkill /F /PID <进程ID>
  ```

### 问题 2: 数据库连接失败

**错误信息:**
```
PostgreSQL数据库未连接
```

**解决方案:**
1. 确保 PostgreSQL 服务正在运行
2. 检查 `packages/backend/.env` 中的数据库配置
3. 测试数据库连接:
   ```bash
   psql -U postgres -h localhost -p 5432 -d ainote
   ```

### 问题 3: 局域网无法访问

**解决方案:**
1. 确保设备和服务器在同一局域网
2. 检查防火墙设置(见上文)
3. 确保前端启动时使用了 `--host 0.0.0.0` 参数
4. 检查后端 `packages/backend/.env` 中的 `CORS_ORIGIN` 配置

### 问题 4: Prisma Client 生成失败

**解决方案:**
```bash
cd packages/backend
pnpm prisma generate
# 或
npm run prisma:generate
```

## 📋 演示账号

```
邮箱: demo@ainote.com
密码: demo123456
```

## 🎨 自定义配置

### 修改端口

编辑脚本中的端口配置:

**restart.bat / stop.bat:**
```batch
set "BACKEND_PORT=3001"
set "FRONTEND_PORT=3100"
```

**start.sh / stop.sh:**
```bash
BACKEND_PORT=3001
FRONTEND_PORT=3100
PRISMA_PORT=5555
```

同时需要修改:
- `packages/frontend/.env` 中的 `VITE_API_BASE_URL`
- `packages/backend/.env` 中的 `PORT` 和 `CORS_ORIGIN`

### 修改数据库连接

编辑 `packages/backend/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/ainote?schema=public"
```

## 📞 技术支持

如遇问题,请查看:
1. 日志文件: `logs/*.log`
2. 项目文档: `CLAUDE.md`
3. GitHub Issues

## 🔄 自动重启监控

`restart.sh` 脚本包含自动监控功能,会定期检查服务状态并在服务异常时自动重启。

**监控间隔:** 10 秒

**监控内容:**
- 后端健康检查 (`/health` 端点)
- 前端连接状态

**停止监控:** 按 `Ctrl+C`

## 📌 注意事项

1. **首次运行前** 确保:
   - PostgreSQL 数据库已安装并运行
   - 已执行 `pnpm install` 安装依赖
   - 已配置 `packages/backend/.env`

2. **Windows 用户**:
   - 建议使用 Git Bash 或 PowerShell
   - 确保 `pnpm` 或 `npm` 已添加到 PATH

3. **生产环境**:
   - 修改默认密码
   - 使用环境变量管理敏感信息
   - 配置 HTTPS
   - 设置反向代理 (Nginx)

## 🎉 完成启动

启动成功后,你应该看到:

```
╔════════════════════════════════════════╗
║      AiNote 服务启动成功! 🎉           ║
╚════════════════════════════════════════╝

📱 本地访问:
   前端: http://localhost:3100
   后端: http://localhost:3001

🌐 局域网访问:
   前端: http://192.168.x.x:3100
   后端: http://192.168.x.x:3001
```

现在可以在浏览器中访问应用了! 🚀
