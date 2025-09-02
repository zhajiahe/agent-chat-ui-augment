#!/bin/bash

# =============================================================================
# 前端服务停止脚本
# =============================================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="agent-chat-ui"
PID_FILE="$PROJECT_NAME.pid"
LOG_FILE="log.frontend"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2 | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# 检查进程是否运行
is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        else
            log_warn "PID文件存在但进程不在运行，清理PID文件"
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# 停止服务
stop_service() {
    if ! is_running; then
        log_warn "服务未在运行"
        return 1
    fi

    local pid=$(cat "$PID_FILE")
    log_info "正在停止 $PROJECT_NAME 服务 (PID: $pid)..."
    
    # 发送TERM信号
    kill $pid 2>/dev/null
    
    # 等待进程结束
    local count=0
    while kill -0 $pid 2>/dev/null && [ $count -lt 15 ]; do
        echo -n "."
        sleep 1
        count=$((count + 1))
    done
    echo ""
    
    # 如果进程仍在运行，强制终止
    if kill -0 $pid 2>/dev/null; then
        log_warn "进程未响应，强制终止..."
        kill -9 $pid 2>/dev/null
        sleep 1
    fi
    
    # 最终检查
    if kill -0 $pid 2>/dev/null; then
        log_error "无法停止进程 $pid"
        return 1
    fi
    
    # 清理PID文件
    rm -f "$PID_FILE"
    log_success "服务已停止"
}

# 强制停止所有相关进程
force_stop() {
    log_warn "强制停止所有相关进程..."
    
    # 查找并终止npm进程
    local npm_pids=$(pgrep -f "npm.*start" 2>/dev/null || true)
    if [ -n "$npm_pids" ]; then
        log_info "发现npm进程: $npm_pids"
        echo "$npm_pids" | xargs kill -9 2>/dev/null || true
    fi
    
    # 查找并终止Next.js进程
    local next_pids=$(pgrep -f "next.*start" 2>/dev/null || true)
    if [ -n "$next_pids" ]; then
        log_info "发现Next.js进程: $next_pids"
        echo "$next_pids" | xargs kill -9 2>/dev/null || true
    fi
    
    # 查找并终止Node.js进程（包含项目名称）
    local node_pids=$(pgrep -f "node.*agent-chat" 2>/dev/null || true)
    if [ -n "$node_pids" ]; then
        log_info "发现Node.js进程: $node_pids"
        echo "$node_pids" | xargs kill -9 2>/dev/null || true
    fi
    
    # 清理PID文件
    rm -f "$PID_FILE"
    
    log_success "强制停止完成"
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [stop|force|help]"
    echo ""
    echo "命令:"
    echo "  stop     正常停止服务 (默认)"
    echo "  force    强制停止所有相关进程"
    echo "  help     显示此帮助信息"
    echo ""
    echo "文件:"
    echo "  $PID_FILE   进程ID文件"
    echo "  $LOG_FILE     服务日志文件"
}

# 主函数
main() {
    case "${1:-stop}" in
        stop)
            stop_service
            ;;
        force)
            force_stop
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 如果直接执行脚本，调用main函数
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
