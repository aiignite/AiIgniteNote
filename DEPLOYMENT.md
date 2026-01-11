# 部署说明

## 当前配置

### 前端配置
- API 地址: `http://43.156.7.244:3001` (直接访问后端服务器 IP)
- 构建输出: `packages/frontend/dist/`

### 后端配置
- 监听地址: `0.0.0.0:3001`
- CORS 已配置支持:
  - 所有 IP 地址访问
  - `aiignite.com.cn` 域名
  - `43.156.7.244` IP 地址

## 部署步骤

### 1. 重启后端服务

```bash
# 停止现有后端进程
pm2 stop all

# 重新构建
cd packages/backend
pnpm build

# 启动后端
pm2 start dist/index.js --name ainote-backend

# 查看日志
pm2 logs ainote-backend
```

### 2. 部署前端到 IIS

1. 将 `packages/frontend/dist` 目录复制到 IIS 网站目录
2. 确保 `web.config` 文件在 `dist` 目录中
3. 在 IIS 管理器中重启网站

### 3. 访问方式

#### 通过 IP 地址访问 (HTTP)
```
前端: http://<IIS服务器IP>/
后端: http://43.156.7.244:3001
```

#### 通过域名访问 (需要 HTTPS)
```
前端: https://aiignite.com.cn
后端: http://43.156.7.244:3001 (跨域)
```

**注意**: HTTPS 前端访问 HTTP 后端会有混合内容警告，需要配置后端支持 HTTPS。

### 4. 测试登录

使用以下测试账号:
```
邮箱: demo@ainote.com
密码: demo123456
```

## 问题排查

### CORS 错误
如果看到 CORS 错误，检查:
1. 后端服务是否正在运行
2. 后端 CORS 配置是否包含你的访问地址
3. 查看后端日志: `pm2 logs ainote-backend`

### 混合内容错误
如果浏览器阻止 HTTPS 页面访问 HTTP API:
1. 临时方案: 使用 HTTP 访问前端
2. 永久方案: 配置后端 HTTPS

### 500 错误
检查 IIS 配置和日志:
```
C:\inetpub\logs\LogFiles\W3SVC*\
```

## 后端 HTTPS 配置 (可选)

为了支持 HTTPS 前端访问，建议在后端服务器上配置 HTTPS。

### 使用 Nginx 反向代理

```nginx
server {
    listen 443 ssl;
    server_name 43.156.7.244;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

然后更新 `.env.production`:
```
VITE_API_BASE_URL=https://43.156.7.244
```
