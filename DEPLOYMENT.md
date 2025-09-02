# 服务部署脚本使用说明

本项目提供了完整的前端服务启停脚本，支持进程管理、日志记录和状态监控。

## 脚本文件

- `start.sh` - 服务启动脚本
- `stop.sh` - 服务停止脚本

## 快速开始

### 1. 环境准备

确保项目依赖已安装：
```bash
npm install
# 或
pnpm install
```

确保有.env配置文件：
```bash
cp env.example .env
# 根据需要修改.env中的配置
```

### 2. 启动服务

```bash
# 启动服务（默认命令）
./start.sh

# 或明确指定start命令
./start.sh start
```

启动成功后会显示：
- 服务PID
- 访问地址 (http://localhost:3000)
- 日志文件位置

### 3. 停止服务

```bash
# 正常停止服务
./stop.sh

# 或使用start.sh的stop命令
./start.sh stop

# 强制停止所有相关进程
./stop.sh force
```

### 4. 其他操作

```bash
# 重启服务
./start.sh restart

# 查看服务状态
./start.sh status

# 查看帮助信息
./start.sh help
./stop.sh help
```

## 配置说明

### 环境变量

在 `.env` 文件中可以配置以下变量：

- `PORT` - 服务端口，默认3000
- `LANGGRAPH_API_URL` - LangGraph服务地址
- `LANGSMITH_API_KEY` - LangSmith API密钥
- `NEXT_PUBLIC_ASSISTANT_ID` - 助手ID

### 文件说明

- `agent-chat-ui.pid` - 进程ID文件，用于进程管理
- `log.frontend` - 前端服务日志文件
- `.env` - 环境变量配置文件

## 日志查看

```bash
# 实时查看日志
tail -f log.frontend

# 查看最近100行日志
tail -n 100 log.frontend

# 搜索错误日志
grep -i error log.frontend
```

## 进程管理

脚本提供了完善的进程管理功能：

1. **自动检测重复启动** - 防止重复启动同一服务
2. **优雅停止** - 发送TERM信号，等待进程正常退出
3. **强制终止** - 当正常停止失败时，使用KILL信号强制终止
4. **PID文件管理** - 自动创建和清理PID文件
5. **状态检查** - 检查服务运行状态和进程信息

## UV虚拟环境支持

脚本会自动检测并激活UV虚拟环境（如果存在）：

```bash
# 如果系统安装了uv，脚本会尝试激活.venv环境
source .venv/bin/activate
```

## 故障排除

### 服务启动失败

1. 检查端口是否被占用：
   ```bash
   netstat -tlnp | grep :3000
   ```

2. 查看详细日志：
   ```bash
   cat log.frontend
   ```

3. 检查依赖是否安装完整：
   ```bash
   npm install
   ```

### 服务无法停止

1. 使用强制停止：
   ```bash
   ./stop.sh force
   ```

2. 手动查找进程：
   ```bash
   ps aux | grep node
   ps aux | grep npm
   ```

3. 手动终止进程：
   ```bash
   kill -9 <PID>
   ```

### 权限问题

确保脚本有执行权限：
```bash
chmod +x start.sh stop.sh
```

## 生产环境建议

1. **定期清理日志**：
   ```bash
   # 添加到crontab，每天凌晨2点清理7天前的日志
   0 2 * * * find /path/to/project -name "log.frontend*" -mtime +7 -delete
   ```

2. **监控脚本**：
   ```bash
   # 创建健康检查脚本
   #!/bin/bash
   ./start.sh status || ./start.sh start
   ```

3. **系统服务化**：
   可以将启动脚本配置为systemd服务，实现开机自启动和故障自动重启。

## 注意事项

- 脚本会记录详细的操作日志到 `log.frontend` 文件
- PID文件用于进程管理，请勿手动删除
- 建议在生产环境中配置反向代理（如Nginx）
- 确保.env文件中的敏感信息安全性
