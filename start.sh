
#!/bin/bash

# =============================================================================
# 前端服务启动脚本
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
DEFAULT_PORT=3000

# 读取.env文件中的环境变量
load_env_file() {
    local env_file="$1"
    if [ ! -f "$env_file" ]; then
        log_warn ".env文件不存在: $env_file"
        return 1
    fi

    log_info "从 $env_file 加载环境变量..."

    # 读取.env文件，跳过注释行和空行
    while IFS='=' read -r key value || [ -n "$key" ]; do
        # 跳过注释行和空行
        [[ $key =~ ^[[:space:]]*# ]] && continue
        [[ -z "$key" ]] && continue

        # 去除键和值的空白字符
        key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

        # 去除值的引号（如果有的话）
        value=$(echo "$value" | sed 's/^"\(.*\)"$/\1/;s/^'\''\(.*\)'\''$/\1/')

        # 设置环境变量
        if [ -n "$key" ] && [ -n "$value" ]; then
            export "$key=$value"
            log_info "设置环境变量: $key=${value:0:20}..."  # 只显示前20个字符
        fi
    done < "$env_file"

    log_success "环境变量加载完成"
}

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

# 启动服务
start_service() {
    if is_running; then
        local pid=$(cat "$PID_FILE")
        log_warn "服务已经在运行 (PID: $pid)"
        return 1
    fi

    log_info "正在启动 $PROJECT_NAME 服务..."
    
    # 检查是否存在package.json
    if [ ! -f "package.json" ]; then
        log_error "package.json 文件不存在"
        return 1
    fi

    # 激活uv虚拟环境（如果存在）
    if command -v uv >/dev/null 2>&1; then
        log_info "检测到uv，激活虚拟环境..."
        source .venv/bin/activate 2>/dev/null || log_warn "无法激活uv虚拟环境"
    fi

    # 设置端口
    local port=${PORT:-$DEFAULT_PORT}
    export PORT=$port
    
    log_info "使用端口: $port"
    log_info "日志输出到: $LOG_FILE"
    
    # 启动服务
    nohup npm run start > "$LOG_FILE" 2>&1 & 
    local pid=$!
    
    # 保存PID
    echo $pid > "$PID_FILE"
    
    # 等待一下检查是否启动成功
    sleep 3
    if kill -0 $pid 2>/dev/null; then
        log_success "服务启动成功! PID: $pid"
        log_info "服务地址: http://localhost:$port"
        log_info "查看日志: tail -f $LOG_FILE"
    else
        log_error "服务启动失败，请检查日志: $LOG_FILE"
        rm -f "$PID_FILE"
        return 1
    fi
}

# 停止服务
stop_service() {
    if ! is_running; then
        log_warn "服务未在运行"
        return 1
    fi

    local pid=$(cat "$PID_FILE")
    log_info "正在停止服务 (PID: $pid)..."
    
    # 发送TERM信号
    kill $pid 2>/dev/null
    
    # 等待进程结束
    local count=0
    while kill -0 $pid 2>/dev/null && [ $count -lt 10 ]; do
        sleep 1
        count=$((count + 1))
    done
    
    # 如果进程仍在运行，强制终止
    if kill -0 $pid 2>/dev/null; then
        log_warn "进程未响应，强制终止..."
        kill -9 $pid 2>/dev/null
    fi
    
    # 清理PID文件
    rm -f "$PID_FILE"
    log_success "服务已停止"
}

# 重启服务
restart_service() {
    log_info "重启服务..."
    stop_service
    sleep 2
    start_service
}

# 查看服务状态
status_service() {
    if is_running; then
        local pid=$(cat "$PID_FILE")
        log_success "服务正在运行 (PID: $pid)"
        
        # 显示端口信息
        local port=${PORT:-$DEFAULT_PORT}
        log_info "服务地址: http://localhost:$port"
        log_info "日志文件: $LOG_FILE"
        
        # 显示进程信息
        ps -p $pid -o pid,ppid,cmd --no-headers 2>/dev/null || log_warn "无法获取进程详细信息"
    else
        log_warn "服务未运行"
        return 1
    fi
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [start|stop|restart|status|help]"
    echo ""
    echo "命令:"
    echo "  start    启动服务"
    echo "  stop     停止服务"  
    echo "  restart  重启服务"
    echo "  status   查看服务状态"
    echo "  help     显示此帮助信息"
    echo ""
    echo "环境变量:"
    echo "  PORT     服务端口 (默认: $DEFAULT_PORT)"
    echo ""
    echo "文件:"
    echo "  .env     环境变量配置文件"
    echo "  $PID_FILE   进程ID文件"
    echo "  $LOG_FILE     服务日志文件"
}

# 主函数
main() {
    # 加载环境变量
    load_env_file ".env" || load_env_file "env.example"
    
    # 处理命令行参数
    case "${1:-start}" in
        start)
            start_service
            ;;
        stop)
            stop_service
            ;;
        restart)
            restart_service
            ;;
        status)
            status_service
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