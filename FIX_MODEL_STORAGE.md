# 🔧 模型配置存储问题修复

## 问题描述

新建的模型配置刷新后丢失,无法保存到 PostgreSQL 数据库。

## 根本原因

**`ENCRYPTION_KEY` 格式错误** - 加密密钥必须是 64 个十六进制字符(32字节),但之前只有 32 个普通字符:

```env
# ❌ 错误 (会导致加密失败)
ENCRYPTION_KEY=your-32-character-encryption-key

# ✅ 正确 (64个十六进制字符)
ENCRYPTION_KEY=d46c1fe4de43f9989d2568c94cbf41e9bc3dfb9c071b38d484f7fede4f87ba3b
```

当加密密钥格式不正确时,后端在保存 API Key 时会失败,导致整个配置无法保存到数据库。

## 已修复的内容

### 1. 更新了加密密钥

**文件**: `packages/backend/.env`

```diff
- ENCRYPTION_KEY=your-32-character-encryption-key
+ ENCRYPTION_KEY=d46c1fe4de43f9989d2568c94cbf41e9bc3dfb9c071b38d484f7fede4f87ba3b
```

### 2. 添加了详细的调试日志

**文件**: `packages/frontend/src/store/modelStore.ts`

添加了详细的日志输出,帮助追踪配置创建过程中的每一步:

```
🔧 [modelStore] 开始创建配置
📡 [modelStore] 调用后端 API...
✅ [modelStore] 后端 API 响应
💾 [modelStore] 同步到 IndexedDB...
✅ [modelStore] IndexedDB 保存成功
✅ [modelStore] 配置创建完成
```

### 3. 更新了环境变量示例

**文件**: `packages/backend/.env.example`

添加了注释说明如何生成正确的加密密钥。

## 需要执行的操作

### ⚠️ 重要: 重启后端服务

修改 `.env` 文件后,**必须重启后端服务**才能生效!

**Windows 用户:**
```cmd
# 方法 1: 使用脚本
stop.bat
restart.bat

# 方法 2: 手动重启
# 1. 关闭当前运行的后端进程
# 2. 双击 restart.bat
```

**Linux/macOS 用户:**
```bash
./stop.sh
./restart.sh
```

## 验证修复

1. **打开浏览器开发者工具** (F12)
2. **切换到 Console 标签页**
3. **创建新的模型配置**
4. **查看控制台日志**,应该看到:
   ```
   🔧 [modelStore] 开始创建配置
   📡 [modelStore] 调用后端 API...
   ✅ [modelStore] 后端 API 响应
   ✅ [modelStore] 配置创建完成
   ```

5. **刷新页面**,确认配置仍然存在

## 生成新的加密密钥 (可选)

如果需要为生产环境生成新的随机密钥:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

将输出的 64 个十六进制字符复制到 `.env` 文件中的 `ENCRYPTION_KEY`。

## 技术细节

### 加密算法

- **算法**: AES-256-GCM
- **密钥长度**: 32字节 (256位)
- **密钥格式**: 64个十六进制字符
- **IV**: 16字节随机生成
- **Auth Tag**: 16字节

### 为什么需要 64 个字符?

AES-256 需要 32 字节(256位)的密钥。当我们使用十六进制表示时:
- 每个十六进制字符代表 4 位
- 2 个十六进制字符 = 1 字节
- 32 字节 = 64 个十六进制字符

### 加密流程

```
原始 API Key
  ↓ 加密 (AES-256-GCM)
IV:AuthTag:EncryptedData (存储到数据库)
  ↓ 解密
原始 API Key (返回给前端)
```

## 相关文件

- `packages/backend/.env` - 环境变量配置
- `packages/backend/src/utils/encryption.ts` - 加密工具
- `packages/backend/src/routes/models.routes.ts` - 模型配置 API
- `packages/frontend/src/store/modelStore.ts` - 前端状态管理

## 其他可能的问题

如果重启后仍然无法保存,请检查:

### 1. 数据库连接

```bash
psql -U postgres -h localhost -p 5432 -d ainote -c "SELECT NOW();"
```

### 2. 后端日志

```bash
tail -f logs/backend.log
```

### 3. 浏览器网络请求

打开开发者工具 → Network 标签页,查看:
- 请求 URL: `POST /api/v1/models/configs`
- 状态码: 应该是 `200` 或 `201`
- 响应数据: 应该包含新创建的配置

### 4. CORS 配置

确认 `packages/backend/.env` 中的 `CORS_ORIGIN` 包含前端地址:

```env
CORS_ORIGIN=http://localhost:3100
```

如果使用局域网访问,还需要添加对应的 IP 地址。

## 需要帮助?

如果问题仍然存在,请提供以下信息:

1. 后端日志 (`logs/backend.log`)
2. 浏览器控制台日志
3. 浏览器 Network 标签页中的请求/响应详情
4. 数据库查询结果:
   ```sql
   SELECT * FROM model_configs ORDER BY created_at DESC LIMIT 5;
   ```
