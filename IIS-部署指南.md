# AI Note - IIS 部署指南

## 系统要求

### 服务器环境
- Windows Server 2016+ 或 Windows 10+
- IIS 10.0+
- Node.js 18.0+ (LTS版本推荐)
- .NET Framework 4.7.2+ (用于URL重写模块)

### IIS功能模块
确保启用以下IIS功能：
- IIS管理控制台
- 万维网服务
- HTTP重定向
- 静态内容
- 默认文档
- HTTP错误
- HTTP日志记录

### 必需的IIS扩展
- **URL重写模块 2.1** (必须安装)
  - 下载地址: https://www.iis.net/downloads/microsoft/url-rewrite
  - 或使用Web平台安装程序安装

## 部署步骤

### 1. 构建项目
```bash
# 安装依赖
pnpm install

# 构建生产版本
pnpm run build
```

### 2. 自动部署 (推荐)
运行部署脚本：
```cmd
deploy-to-iis.bat
```

此脚本将自动：
- 检查构建文件
- 创建IIS站点目录
- 复制前端文件到IIS目录
- 复制后端文件到服务目录
- 生成启动脚本

### 3. 手动部署
如果需要手动部署，请按以下步骤：

#### 3.1 部署前端
1. 将 `packages/frontend/dist/` 目录下的所有文件复制到IIS站点根目录
2. 将 `web.config` 文件复制到站点根目录

#### 3.2 部署后端
1. 创建后端服务目录: `C:\Services\AiNote\Backend`
2. 复制以下文件到服务目录：
   - `packages/backend/dist/` (整个目录)
   - `packages/backend/node_modules/` (整个目录)
   - `packages/backend/prisma/` (整个目录)
   - `packages/backend/package.json`

### 4. 配置IIS站点

#### 4.1 创建站点
1. 打开IIS管理器
2. 右键点击"网站" → "添加网站"
3. 配置站点信息：
   - 网站名称: `AiNote`
   - 物理路径: `C:\inetpub\wwwroot\ainote`
   - 端口: `80` (或其他可用端口)

#### 4.2 配置应用程序池
1. 选择站点的应用程序池
2. 设置".NET CLR版本"为"无托管代码"
3. 设置"托管管道模式"为"集成"

### 5. 配置后端服务

#### 5.1 环境配置
1. 在后端服务目录创建 `.env` 文件
2. 复制 `.env.production` 内容并根据实际环境修改：

```env
# 数据库配置
DATABASE_URL="file:./data/ainote.db"

# JWT密钥 (必须更改)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# 服务器配置
PORT=3000
HOST=0.0.0.0

# CORS配置
CORS_ORIGIN="http://your-domain.com"
```

#### 5.2 数据库初始化
```cmd
cd C:\Services\AiNote\Backend
npx prisma migrate deploy
npx prisma generate
```

#### 5.3 启动后端服务

**方式一: 手动启动**
```cmd
cd C:\Services\AiNote\Backend
node dist/index.js
```

**方式二: 安装为Windows服务 (推荐)**
以管理员身份运行：
```cmd
install-backend-service.bat
```

### 6. 验证部署

#### 6.1 检查前端
访问: `http://your-domain.com`
- 应该能看到AI Note登录页面
- 检查浏览器控制台是否有错误

#### 6.2 检查后端API
访问: `http://your-domain.com/api/health`
- 应该返回健康检查信息

#### 6.3 检查服务状态
```cmd
# 查看Windows服务状态
sc query AiNoteBackend

# 查看服务日志
# 日志通常在: C:\Services\AiNote\Backend\logs\
```

## 故障排除

### 常见问题

#### 1. 404错误 - 页面未找到
- 检查URL重写模块是否已安装
- 检查web.config文件是否正确配置
- 检查IIS站点物理路径是否正确

#### 2. API请求失败
- 检查后端服务是否正在运行
- 检查端口3000是否被占用
- 检查防火墙设置
- 检查CORS配置

#### 3. 静态资源加载失败
- 检查MIME类型配置
- 检查文件权限
- 检查IIS静态内容功能是否启用

#### 4. 数据库连接失败
- 检查数据库文件路径
- 检查文件权限
- 运行数据库迁移命令

### 日志查看

#### IIS日志
位置: `C:\inetpub\logs\LogFiles\W3SVC1\`

#### 应用程序日志
- Windows事件查看器
- 应用程序和服务日志

#### 后端服务日志
位置: `C:\Services\AiNote\Backend\logs\`

## 性能优化

### 1. 启用压缩
web.config已配置HTTP压缩，确保IIS压缩功能已启用

### 2. 缓存配置
根据需要调整web.config中的缓存策略

### 3. 静态资源CDN
考虑将静态资源部署到CDN以提高加载速度

## 安全建议

### 1. HTTPS配置
- 安装SSL证书
- 强制HTTPS重定向
- 配置HSTS头

### 2. 安全头配置
在web.config中添加安全响应头：
```xml
<httpProtocol>
  <customHeaders>
    <add name="X-Frame-Options" value="DENY" />
    <add name="X-Content-Type-Options" value="nosniff" />
    <add name="X-XSS-Protection" value="1; mode=block" />
  </customHeaders>
</httpProtocol>
```

### 3. 访问控制
- 配置适当的文件和目录权限
- 限制不必要的HTTP方法
- 配置IP访问限制（如需要）

## 维护和监控

### 1. 定期备份
- 数据库文件备份
- 配置文件备份
- 上传文件备份

### 2. 监控
- 设置性能计数器监控
- 配置日志轮转
- 监控磁盘空间使用

### 3. 更新
- 定期更新Node.js
- 更新应用程序依赖
- 应用安全补丁

## 联系支持

如果遇到部署问题，请检查：
1. 系统要求是否满足
2. 所有必需的模块是否已安装
3. 配置文件是否正确
4. 日志文件中的错误信息

更多技术支持，请参考项目文档或联系开发团队。