#!/bin/bash

# AiNote 重启脚本
# 停止并重新启动后端和前端服务

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 主流程
main() {
    clear
    echo -e "${PURPLE}"
    echo "╔════════════════════════════════════════╗"
    echo "║         AiNote 重启脚本 🔄            ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""

    echo -e "${YELLOW}正在停止服务...${NC}"
    echo ""
    bash "$PROJECT_ROOT/stop.sh"

    echo ""
    echo -e "${YELLOW}等待 2 秒后重新启动...${NC}"
    echo ""
    sleep 2

    bash "$PROJECT_ROOT/start.sh"
}

# 运行主流程
main
