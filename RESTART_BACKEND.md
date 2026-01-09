# 🔴 重要: 必须重启后端服务!

## 问题原因

后端进程仍在使用旧的(错误的)加密密钥,即使 `.env` 文件已经更新。

## ✅ 解决方案

### Windows 用户

**方法 1: 使用批处理脚本 (推荐)**
```cmd
stop.bat
timeout /t 2
restart.bat
```

**方法 2: 手动重启**
1. 按 `Ctrl+C` 停止后端进程
2. 或打开任务管理器,找到 `node.exe` 进程并结束
3. 双击 `restart.bat` 重新启动

### Linux/macOS 用户

```bash
./stop.sh
./restart.sh
```

## 🔍 验证是否已重启

重启后,运行诊断脚本:

```bash
node check-backend-status.js
```

应该看到:
```
4️⃣ 测试模型创建 API...
✅ 模型创建成功!
   ID: cmxxxx
   名称: 测试模型-xxxxx
```

## 🧪 测试步骤

1. **重启后端服务**
2. **打开浏览器** → http://localhost:3100
3. **登录** (demo@ainote.com / demo123456)
4. **打开开发者工具** (F12) → Console 标签页
5. **进入模型管理页面**
6. **创建新模型配置**
7. **查看控制台日志**,应该看到:
   ```
   🔧 [modelStore] 开始创建配置
   📡 [modelStore] 调用后端 API...
   ✅ [modelStore] 后端 API 响应
   ✅ [modelStore] 配置创建完成
   ```
8. **刷新页面**
9. **确认配置仍然存在** ✅

## 📝 为什么需要重启?

Node.js 在启动时读取 `.env` 文件,运行时不会自动重新加载环境变量。修改 `.env` 后必须重启进程才能生效。

## ❓ 如果重启后仍有问题

运行以下命令检查:

```bash
# 检查后端是否使用了新的密钥
cd packages/backend
grep ENCRYPTION_KEY .env
```

应该看到 64 个十六进制字符,而不是 `your-32-character-encryption-key`。

如果仍有问题,请提供:
1. `node check-backend-status.js` 的完整输出
2. `logs/backend.log` 的最后 50 行
