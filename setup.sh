#!/bin/bash

# AiNote 快速启动脚本
# 此脚本用于初始化和启动 AiNote 项目

set -e

echo "🚀 AiNote 快速启动脚本"
echo "======================"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查依赖
check_dependencies() {
    echo -e "${YELLOW}检查系统依赖...${NC}"

    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        echo "请安装 Node.js >= 18: https://nodejs.org/"
        exit 1
    fi

    if ! command -v pnpm &> /dev/null; then
        echo -e "${YELLOW}⚠️  pnpm 未安装，正在安装...${NC}"
        npm install -g pnpm
    fi

    echo -e "${GREEN}✅ 依赖检查完成${NC}"
}

# 安装项目依赖
install_dependencies() {
    echo -e "${YELLOW}安装项目依赖...${NC}"
    pnpm install
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
}

# 检查环境变量
check_env() {
    echo -e "${YELLOW}检查环境变量...${NC}"

    if [ ! -f "packages/backend/.env" ]; then
        echo -e "${YELLOW}⚠️  未找到 .env 文件${NC}"
        echo "创建示例 .env 文件..."

        cp packages/backend/.env.example packages/backend/.env

        # 生成随机密钥
        JWT_SECRET=$(openssl rand -base64 32)
        ENCRYPTION_KEY=$(openssl rand -hex 32)

        # 更新 .env 文件
        sed -i '' "s/your-super-secret-jwt-key/$JWT_SECRET/" packages/backend/.env
        sed -i '' "s/your-32-character-encryption-key/$ENCRYPTION_KEY/" packages/backend/.env

        echo -e "${GREEN}✅ 已创建 .env 文件${NC}"
        echo -e "${YELLOW}⚠️  请配置 DATABASE_URL 后继续${NC}"
        echo ""
        echo "请编辑 packages/backend/.env 并设置："
        echo "  - DATABASE_URL: PostgreSQL 连接字符串"
        echo ""
        read -p "按 Enter 继续（或 Ctrl+C 退出配置）..."
    else
        echo -e "${GREEN}✅ .env 文件已存在${NC}"
    fi
}

# 初始化数据库
init_database() {
    echo -e "${YELLOW}初始化数据库...${NC}"

    cd packages/backend

    # 生成 Prisma Client
    echo "生成 Prisma Client..."
    pnpm prisma generate

    # 运行迁移
    echo "运行数据库迁移..."
    pnpm prisma migrate deploy

    # 运行种子数据
    echo "导入种子数据..."
    pnpm prisma db seed

    cd ../..

    echo -e "${GREEN}✅ 数据库初始化完成${NC}"
}

# 构建项目
build_project() {
    echo -e "${YELLOW}构建项目...${NC}"

    # 构建 shared 包
    echo "构建 @ainote/shared..."
    cd packages/shared
    pnpm build
    cd ../..

    echo -e "${GREEN}✅ 项目构建完成${NC}"
}

# 启动开发服务器
start_dev() {
    echo ""
    echo -e "${GREEN}=================================${NC}"
    echo -e "${GREEN}🎉 AiNote 准备就绪！${NC}"
    echo -e "${GREEN}=================================${NC}"
    echo ""
    echo "启动开发服务器..."
    echo ""
    echo -e "前端地址: ${YELLOW}http://localhost:5173${NC}"
    echo -e "后端地址: ${YELLOW}http://localhost:3001${NC}"
    echo ""
    echo "演示账号："
    echo "  邮箱: demo@ainote.com"
    echo "  密码: demo123456"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    echo ""

    # 启动后端和前端
    pnpm dev &
    pnpm dev:backend &
    wait
}

# 主函数
main() {
    check_dependencies
    install_dependencies
    check_env
    build_project
    init_database
    start_dev
}

# 运行主函数
main
