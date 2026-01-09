#!/bin/bash

# AiNote 启动脚本
# 自动检测并处理端口占用,启动后端和前端服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 端口配置
BACKEND_PORT=3001
FRONTEND_PORT=3100
PRISMA_PORT=5555

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/packages/backend"
FRONTEND_DIR="$PROJECT_ROOT/packages/frontend"

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
            # 备用方案: 使用 netstat
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
            # 备用方案
            netstat -anp 2>/dev/null | grep ":$port " | grep "LISTEN" | awk '{print $7}' | cut -d'/' -f1
        fi
    fi
}

# 停止指定端口的进程
kill_port_process() {
    local port=$1
    local pid=$(get_port_pid $port)

    if [ -n "$pid" ]; then
        log_warning "端口 $port 被进程 $pid 占用"
        log_info "正在停止进程 $pid..."

        kill $pid 2>/dev/null || true
        sleep 2

        # 如果进程还在,强制杀死
        if check_port $port; then
            log_warning "进程 $pid 未响应,强制停止..."
            kill -9 $pid 2>/dev/null || true
            sleep 1
        fi

        if ! check_port $port; then
            log_success "端口 $port 已释放"
        else
            log_error "无法释放端口 $port"
            exit 1
        fi
    fi
}

# 清理端口
cleanup_ports() {
    log_step "检查端口占用情况..."

    # 检查后端端口
    if check_port $BACKEND_PORT; then
        log_warning "检测到后端端口 $BACKEND_PORT 被占用"
        kill_port_process $BACKEND_PORT
    else
        log_success "后端端口 $BACKEND_PORT 可用"
    fi

    # 检查前端端口
    if check_port $FRONTEND_PORT; then
        log_warning "检测到前端端口 $FRONTEND_PORT 被占用"
        kill_port_process $FRONTEND_PORT
    else
        log_success "前端端口 $FRONTEND_PORT 可用"
    fi

    # 检查 Prisma Studio 端口
    if check_port $PRISMA_PORT; then
        log_warning "检测到 Prisma Studio 端口 $PRISMA_PORT 被占用"
        kill_port_process $PRISMA_PORT
    else
        log_success "Prisma Studio 端口 $PRISMA_PORT 可用"
    fi
}

# 启动后端服务
start_backend() {
    log_step "启动后端服务..."

    cd "$BACKEND_DIR"

    # 检查环境变量文件
    if [ ! -f ".env" ]; then
        log_error "后端 .env 文件不存在"
        exit 1
    fi

    # 检查PostgreSQL数据库连接
    if ! PGPASSWORD=wangyh76 psql -U postgres -h localhost -p 5432 -d ainote -c "SELECT 1" >/dev/null 2>&1; then
        log_error "PostgreSQL数据库未连接，请确保PostgreSQL服务正在运行"
        exit 1
    fi

    # 生成 Prisma Client
    log_info "生成 Prisma Client..."
    npm run prisma:generate --silent

    # 启动后端 (后台运行)
    log_info "启动后端服务器 (端口 $BACKEND_PORT)..."
    nohup npm run dev > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
    BACKEND_PID=$!

    # 保存 PID
    echo $BACKEND_PID > "$PROJECT_ROOT/logs/backend.pid"

    # 等待后端启动
    log_info "等待后端服务启动..."
    sleep 3

    # 检查后端是否成功启动
    if check_port $BACKEND_PORT; then
        log_success "后端服务启动成功 (PID: $BACKEND_PID)"
        log_info "后端地址: ${CYAN}http://localhost:$BACKEND_PORT${NC}"
        log_info "日志文件: $PROJECT_ROOT/logs/backend.log"
    else
        log_error "后端服务启动失败,请查看日志: tail -f logs/backend.log"
        exit 1
    fi
}

# 启动前端服务
start_frontend() {
    log_step "启动前端服务..."

    cd "$FRONTEND_DIR"

    # 检查环境变量文件
    if [ ! -f ".env" ]; then
        log_warning "前端 .env 文件不存在,正在创建..."
        cat > .env << EOF
VITE_API_BASE_URL=http://localhost:$BACKEND_PORT
EOF
        log_success "前端 .env 文件已创建"
    fi

    # 启动前端 (后台运行,监听所有网络接口)
    log_info "启动前端服务器 (端口 $FRONTEND_PORT)..."
    nohup npm run dev -- --host 0.0.0.0 --port $FRONTEND_PORT > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
    FRONTEND_PID=$!

    # 保存 PID
    echo $FRONTEND_PID > "$PROJECT_ROOT/logs/frontend.pid"

    # 等待前端启动
    log_info "等待前端服务启动..."
    sleep 3

    # 检查前端是否成功启动
    if check_port $FRONTEND_PORT; then
        log_success "前端服务启动成功 (PID: $FRONTEND_PID)"
        log_info "前端地址: ${CYAN}http://localhost:$FRONTEND_PORT${NC}"
        log_info "日志文件: $PROJECT_ROOT/logs/frontend.log"
    else
        log_error "前端服务启动失败,请查看日志: tail -f logs/frontend.log"
        exit 1
    fi
}

# 启动 Prisma Studio
start_prisma_studio() {
    log_step "启动 Prisma Studio..."

    cd "$BACKEND_DIR"

    # 启动 Prisma Studio (后台运行)
    log_info "启动 Prisma Studio (端口 $PRISMA_PORT)..."
    nohup npm run prisma:studio > "$PROJECT_ROOT/logs/prisma.log" 2>&1 &
    PRISMA_PID=$!

    # 保存 PID
    echo $PRISMA_PID > "$PROJECT_ROOT/logs/prisma.pid"

    # 等待 Prisma Studio 启动
    log_info "等待 Prisma Studio 启动..."
    sleep 3

    # 检查 Prisma Studio 是否成功启动
    if check_port $PRISMA_PORT; then
        log_success "Prisma Studio 启动成功 (PID: $PRISMA_PID)"
        log_info "Prisma Studio: ${CYAN}http://localhost:$PRISMA_PORT${NC}"
        log_info "日志文件: $PROJECT_ROOT/logs/prisma.log"
    else
        log_warning "Prisma Studio 启动失败,但不影响其他服务"
        log_info "可以稍后手动启动: cd packages/backend && npm run prisma:studio"
    fi
}

# 显示启动信息
show_info() {
    # 获取本机 IP 地址 (跨平台)
    local LOCAL_IP=""
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows
        LOCAL_IP=$(ipconfig | findstr "IPv4" | findstr /V "127.0.0.1" | head -n 1 | awk '{print $14}')
    else
        # Linux/Mac
        if command -v hostname &> /dev/null; then
            LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
        fi
        if [ -z "$LOCAL_IP" ] && command -v ifconfig &> /dev/null; then
            LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
        fi
    fi

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     AiNote 服务启动成功! 🎉           ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}📱 本地访问:${NC}"
    echo -e "   前端: ${CYAN}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "   后端: ${CYAN}http://localhost:$BACKEND_PORT${NC}"
    echo -e "   API:  ${CYAN}http://localhost:$BACKEND_PORT/api/v1${NC}"
    echo -e "   Prisma Studio: ${CYAN}http://localhost:$PRISMA_PORT${NC}"
    echo ""

    if [ -n "$LOCAL_IP" ]; then
        echo -e "${CYAN}🌐 局域网访问:${NC}"
        echo -e "   前端: ${CYAN}http://$LOCAL_IP:$FRONTEND_PORT${NC}"
        echo -e "   后端: ${CYAN}http://$LOCAL_IP:$BACKEND_PORT${NC}"
        echo -e "   API:  ${CYAN}http://$LOCAL_IP:$BACKEND_PORT/api/v1${NC}"
        echo ""
    fi

    echo -e "${YELLOW}📋 演示账号:${NC}"
    echo -e "   邮箱: ${CYAN}demo@ainote.com${NC}"
    echo -e "   密码: ${CYAN}demo123456${NC}"
    echo ""
    echo -e "${PURPLE}📝 日志文件:${NC}"
    echo -e "   后端: tail -f logs/backend.log"
    echo -e "   前端: tail -f logs/frontend.log"
    echo -e "   Prisma: tail -f logs/prisma.log"
    echo ""
    echo -e "${YELLOW}⏹  停止服务:${NC} ./stop.sh 或 stop.bat (Windows)"
    echo ""
}

# 创建日志目录
mkdir -p "$PROJECT_ROOT/logs"

# 主流程
main() {
    clear
    echo -e "${PURPLE}"
    echo "╔════════════════════════════════════════╗"
    echo "║         AiNote 启动脚本 🚀            ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""

    # 清理端口
    cleanup_ports

    # 启动后端
    start_backend

    # 启动前端
    start_frontend

    # 启动 Prisma Studio
    start_prisma_studio

    # 显示信息
    show_info
}

# 运行主流程
main
