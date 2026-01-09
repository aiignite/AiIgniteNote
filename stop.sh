#!/bin/bash

# AiNote 停止脚本
# 停止后端和前端服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 端口配置
BACKEND_PORT=3001
FRONTEND_PORT=3100
PRISMA_PORT=5555

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# 检查端口是否被占用 (跨平台)
check_port() {
    local port=$1

    # Windows (Git Bash/MSYS)
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        netstat -ano | findstr ":$port " | findstr "LISTENING" > /dev/null 2>&1
        return $?
    else
        # Linux/Mac
        if command -v lsof &> /dev/null; then
            lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1
            return $?
        else
            netstat -an 2>/dev/null | grep ":$port " | grep "LISTEN" > /dev/null 2>&1
            return $?
        fi
    fi
}

# 获取端口占用的进程 PID (跨平台)
get_port_pid() {
    local port=$1

    # Windows (Git Bash/MSYS)
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        netstat -ano | findstr ":$port " | findstr "LISTENING" | awk '{print $5}' | head -n 1
    else
        # Linux/Mac
        if command -v lsof &> /dev/null; then
            lsof -ti :$port
        else
            netstat -anp 2>/dev/null | grep ":$port " | grep "LISTEN" | awk '{print $7}' | cut -d'/' -f1
        fi
    fi
}

# 从 PID 文件停止进程
stop_from_pid_file() {
    local service_name=$1
    local pid_file="$PROJECT_ROOT/logs/${service_name}.pid"

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            log_info "停止 $service_name (PID: $pid)..."
            kill $pid 2>/dev/null || true
            sleep 2

            # 如果进程还在,强制杀死
            if ps -p $pid > /dev/null 2>&1; then
                log_warning "$service_name 未响应,强制停止..."
                kill -9 $pid 2>/dev/null || true
                sleep 1
            fi

            log_success "$service_name 已停止"
        else
            log_warning "$service_name 进程不存在 (PID: $pid)"
        fi

        # 删除 PID 文件
        rm -f "$pid_file"
    fi
}

# 通过端口停止进程
stop_by_port() {
    local port=$1
    local service_name=$2

    if check_port $port; then
        local pid=$(get_port_pid $port)
        log_info "停止 $service_name (端口 $port, PID: $pid)..."
        kill $pid 2>/dev/null || true
        sleep 2

        # 如果进程还在,强制杀死
        if check_port $port; then
            log_warning "$service_name 未响应,强制停止..."
            kill -9 $pid 2>/dev/null || true
            sleep 1
        fi

        log_success "$service_name 已停止"
    else
        log_info "$service_name 未运行 (端口 $port)"
    fi
}

# 清理所有相关进程
cleanup_all() {
    log_step "清理所有相关进程..."

    # 停止所有 node 进程中包含 packages/backend 或 packages/frontend 的
    local pids=$(ps aux | grep -E "packages/(backend|frontend)" | grep -v grep | awk '{print $2}')

    if [ -n "$pids" ]; then
        log_info "发现相关进程: $pids"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
        log_success "所有相关进程已停止"
    else
        log_info "没有发现相关进程"
    fi
}

# 主流程
main() {
    clear
    echo -e "${PURPLE}"
    echo "╔════════════════════════════════════════╗"
    echo "║         AiNote 停止脚本 ⏹             ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""

    # 优先从 PID 文件停止
    log_step "尝试从 PID 文件停止服务..."
    stop_from_pid_file "backend"
    stop_from_pid_file "frontend"
    stop_from_pid_file "prisma"

    # 通过端口停止(备用方案)
    log_step "通过端口检查并停止服务..."
    stop_by_port $BACKEND_PORT "后端服务"
    stop_by_port $FRONTEND_PORT "前端服务"
    stop_by_port $PRISMA_PORT "Prisma Studio"

    # 清理所有相关进程
    cleanup_all

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     所有服务已停止 ✅                  ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
}

# 运行主流程
main
