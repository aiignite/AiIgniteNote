# 🚀 AiNote 快速访问

## 📱 本地访问

| 服务 | 地址 | 说明 |
|------|------|------|
| **前端应用** | http://localhost:3100 | React 前端界面 |
| **后端 API** | http://localhost:3001/api/v1 | Fastify API 服务 |
| **Prisma Studio** | http://localhost:5555 | 数据库可视化管理 |

## 🌐 局域网访问

| 服务 | 地址 | 说明 |
|------|------|------|
| **前端应用** | http://192.168.201.97:3100 | 局域网内设备访问 |
| **后端 API** | http://192.168.201.97:3001/api/v1 | 局域网内设备访问 |

## 📋 演示账号

```
邮箱：demo@ainote.com
密码：demo123456
```

## 🔧 快速命令

### Windows
```bash
# 启动所有服务
restart.bat

# 停止所有服务
stop.bat
```

### Linux/Mac
```bash
# 启动所有服务
./start.sh

# 停止所有服务
./stop.sh
```

## 📝 端口说明

| 端口 | 服务 |
|------|------|
| 3100 | 前端 Vite 开发服务器 |
| 3001 | 后端 Fastify API 服务 |
| 5555 | Prisma Studio 数据库管理 |
| 5432 | PostgreSQL 数据库 |

## 🔍 查看本机 IP

### Windows
```bash
ipconfig
```
查找 "IPv4 地址" 下的非 127.0.0.1 的地址

### Linux/Mac
```bash
ifconfig
# 或
ip addr show
```
查找 `inet` 地址

## ⚠️ 注意事项

1. **IP 地址变化**: 局域网 IP 可能因网络环境改变而变化，使用前请确认
2. **防火墙**: 确保防火墙允许相应端口的访问
3. **PostgreSQL**: 确保数据库服务正在运行
4. **依赖安装**: 首次运行需要执行 `pnpm install`

## 📚 相关文档

- [完整部署指南](./DEPLOYMENT_GUIDE.md)
- [项目文档](./CLAUDE.md)
- [助手配置指南](./SYNC_ASSISTANTS.md)

---

**更新时间**: 2026-01-06
**本机 IP**: 192.168.201.97
