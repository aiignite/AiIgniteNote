#!/bin/bash

# AiNote 状态检查脚本
# 检查后端和前端服务的运行状态

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 端口配置
BACKEND_PORT=3001
FRONTEND_PORT=5173
PRISMA_PORT=5555

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0 # 端口被占用
    else
        return 1 # 端口可用
    fi
}

# 获取端口占用的进程 PID
get_port_pid() {
    local port=$1
    lsof -ti :$port 2>/dev/null
}

# 获取进程信息
get_process_info() {
    local pid=$1
    ps -p $pid -o pid,etime,command 2>/dev/null | tail -1
}

# 显示服务状态
show_service_status() {
    local service_name=$1
    local port=$2
    local pid_file="$PROJECT_ROOT/logs/${service_name}.pid"

    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$service_name 状态${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    if [ -f "$pid_file" ]; then
        local saved_pid=$(cat "$pid_file")
        echo -e "  PID 文件: ${GREEN}存在${NC} (PID: $saved_pid)"

        if ps -p $saved_pid > /dev/null 2>&1; then
            echo -e "  进程状态: ${GREEN}运行中${NC}"
            local proc_info=$(get_process_info $saved_pid)
            echo -e "  进程信息: $proc_info"
        else
            echo -e "  进程状态: ${RED}未运行${NC} ${YELLOW}(PID 文件过期)${NC}"
        fi
    else
        echo -e "  PID 文件: ${YELLOW}不存在${NC}"
    fi

    if check_port $port; then
        local current_pid=$(get_port_pid $port)
        echo -e "  端口 $port: ${GREEN}占用中${NC} (PID: $current_pid)"

        # 测试服务响应
        if [ "$service_name" == "backend" ]; then
            if curl -s http://localhost:$port/health > /dev/null 2>&1; then
                echo -e "  健康检查: ${GREEN}通过 ✅${NC}"
            else
                echo -e "  健康检查: ${YELLOW}请求失败 ⚠️${NC}"
            fi
        fi
    else
        echo -e "  端口 $port: ${RED}未监听${NC}"
    fi

    echo ""
}

# 显示日志信息
show_log_info() {
    local service_name=$1
    local log_file="$PROJECT_ROOT/logs/${service_name}.log"

    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$service_name 日志${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    if [ -f "$log_file" ]; then
        local size=$(du -h "$log_file" | awk '{print $1}')
        local lines=$(wc -l < "$log_file")
        echo -e "  日志文件: ${GREEN}存在${NC}"
        echo -e "  文件大小: $size"
        echo -e "  总行数: $lines"
        echo -e "  文件路径: $log_file"
        echo -e "  查看日志: ${CYAN}tail -f logs/${service_name}.log${NC}"
    else
        echo -e "  日志文件: ${YELLOW}不存在${NC}"
    fi

    echo ""
}

# 显示数据库状态
show_database_status() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}数据库状态${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # 检查PostgreSQL连接
    if PGPASSWORD=wangyh76 psql -U postgres -h localhost -p 5432 -d ainote -c "SELECT 1" >/dev/null 2>&1; then
        echo -e "  数据库: ${GREEN}PostgreSQL (已连接)${NC}"
        echo -e "  主机: ${CYAN}localhost:5432${NC}"
        echo -e "  数据库: ${CYAN}ainote${NC}"
    else
        echo -e "  数据库: ${RED}PostgreSQL (未连接)${NC}"
        echo -e "  状态: ${YELLOW}请确保PostgreSQL服务正在运行${NC}"
    fi

    echo ""
}

# 主流程
main() {
    clear
    echo -e "${PURPLE}"
    echo "╔════════════════════════════════════════╗"
    echo "║         AiNote 服务状态 📊             ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""

    # 显示服务状态
    show_service_status "后端服务" $BACKEND_PORT
    show_service_status "前端服务" $FRONTEND_PORT
    show_service_status "Prisma Studio" $PRISMA_PORT

    # 显示日志信息
    show_log_info "backend"
    show_log_info "frontend"
    show_log_info "prisma"

    # 显示数据库状态
    show_database_status

    # 显示快捷命令
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}快捷命令${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "  启动服务: ${CYAN}./start.sh${NC}"
    echo -e "  停止服务: ${CYAN}./stop.sh${NC}"
    echo -e "  重启服务: ${CYAN}./restart.sh${NC}"
    echo -e "  查看状态: ${CYAN}./status.sh${NC}"
    echo ""
}

# 运行主流程
main
