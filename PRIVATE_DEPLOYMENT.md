# 私有化部署指南

## 概述

该应用已配置为私有使用模式，LangGraph API地址不再暴露给客户端。所有API请求都通过内部代理服务器路由，提供更好的安全性。

## 架构说明

```
客户端 → Next.js内部代理 (/api/*) → LangGraph服务器
```

- **客户端**：只知道内部代理路径 `/api`，自动转换为完整URL
- **代理服务器**：位于 `src/app/api/[..._path]/route.ts`
- **LangGraph服务器**：真实地址配置在服务端环境变量中

## 环境变量配置

### 必需的服务端环境变量

```bash
# LangGraph服务器地址（私有，不暴露给客户端）
LANGGRAPH_API_URL=https://your-langgraph-server.example.com

# LangSmith API密钥（私有，不暴露给客户端）
LANGSMITH_API_KEY=lsv2_pt_your_api_key_here
```

### 可选的环境变量

```bash
# 默认助手ID（可在设置中修改）
NEXT_PUBLIC_ASSISTANT_ID=agent
```

### ⚠️ 重要：不要设置的变量

```bash
# 不要设置这个变量 - 应用现在使用内部代理
# NEXT_PUBLIC_API_URL=...
```

## 技术实现详情

### URL 自动转换机制
应用会自动将相对路径 `/api` 转换为完整的 URL：

```typescript
// 在客户端环境中自动构造完整URL
const finalApiUrl = typeof window !== 'undefined' 
  ? `${window.location.origin}/api`  // 例如: http://localhost:3000/api
  : "/api";
```

### 默认值回退逻辑
系统使用多层回退机制确保配置的健壮性：

```typescript
// Assistant ID 回退逻辑
const finalAssistantId = assistantId || envAssistantId || "agent";

// 环境变量 → URL参数 → 默认值
```

### 历史对话自动加载
系统会在以下情况下自动重新加载历史对话：
- Assistant ID 变化时
- 页面首次加载时
- 用户修改设置后

## 安全特性

### 1. API地址隐藏
- LangGraph服务器地址完全隐藏在服务端
- 客户端无法直接访问真实的API地址
- 所有请求通过内部代理验证和转发

### 2. 凭据安全
- API密钥存储在服务端环境变量中
- 客户端无法访问真实的API凭据
- 支持可选的客户端API密钥用于额外认证

### 3. 请求控制
- 所有API请求都经过服务端验证
- 可以在代理层添加额外的安全检查
- 支持请求日志和监控

## 部署步骤

### 1. 配置环境变量

创建 `.env.local` 文件：

```bash
LANGGRAPH_API_URL=https://your-langgraph-server.example.com
LANGSMITH_API_KEY=lsv2_pt_your_api_key_here
NEXT_PUBLIC_ASSISTANT_ID=agent
```

### 2. 构建应用

```bash
pnpm install
pnpm build
```

### 3. 启动应用

```bash
pnpm start
```

或使用PM2：

```bash
pm2 start "pnpm start" --name agent-chat-ui
```

### 4. 验证部署

1. 访问应用：`http://your-domain.com`
2. 检查网络请求是否都指向 `/api/*`
3. 确认真实的LangGraph地址未暴露
4. 测试聊天功能和历史对话加载

## 功能验证清单

部署完成后，请验证以下功能：

- [ ] 页面正常加载，无控制台错误
- [ ] 可以发送消息并收到回复
- [ ] 历史对话正常显示
- [ ] 设置对话框可以打开并保存配置
- [ ] 网络请求都指向 `/api/*` 路径
- [ ] 真实的LangGraph服务器地址未在客户端暴露

### 预期的服务器日志

正常运行时应该看到类似以下的日志：

```
🔒 Secure API proxy initialized successfully
📡 Target server: [CONFIGURED]
🔑 API key: [CONFIGURED]
GET /api/info 200 in XXXms
POST /api/threads/search 200 in XXXms
POST /api/threads/stream 200 in XXXms
```

## 用户设置

用户现在只能配置：

- **Assistant/Graph ID**：指定使用的助手或图ID
- **LangSmith API Key**：可选的额外认证密钥

用户无法修改API服务器地址，确保连接安全。

## 生产环境注意事项

### 1. HTTPS配置
确保生产环境使用HTTPS：

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 2. 代理服务器优化
考虑在 `src/app/api/[..._path]/route.ts` 中添加：

- 请求率限制
- 日志记录
- 错误处理
- 缓存策略

### 3. 监控和日志
- 监控代理服务器性能
- 记录API请求日志
- 设置错误告警

## 故障排除

### 常见问题

#### 1. "Failed to construct 'URL': Invalid URL"
**原因**：URL构造问题（已修复）
**解决方案**：确保使用最新版本的代码

#### 2. 历史对话不显示
**原因**：Assistant ID 配置问题（已修复）
**解决方案**：
- 检查 `NEXT_PUBLIC_ASSISTANT_ID` 环境变量
- 在设置中确认 Assistant ID 配置
- 刷新页面重新加载

#### 3. "无法连接到服务器"
**原因**：LangGraph服务器配置问题
**解决方案**：
- 检查 `LANGGRAPH_API_URL` 是否正确
- 验证网络连接
- 检查LangGraph服务器状态

#### 4. "认证失败"
**原因**：API密钥问题
**解决方案**：
- 检查 `LANGSMITH_API_KEY` 是否有效
- 验证API密钥权限

#### 5. "找不到助手"
**原因**：Assistant ID 不存在
**解决方案**：
- 检查 `NEXT_PUBLIC_ASSISTANT_ID` 配置
- 验证助手ID是否存在于LangGraph服务器

### 调试方法

#### 1. 检查服务端日志
```bash
# 查看Next.js服务端日志
pm2 logs agent-chat-ui

# 或者在开发环境
pnpm dev
```

#### 2. 检查网络请求
打开浏览器开发者工具，确认：
- 所有API请求都指向 `/api/*`
- 没有直接连接外部LangGraph服务器的请求
- 代理日志显示正常

#### 3. 验证环境变量
```bash
# 在服务器上检查环境变量
echo $LANGGRAPH_API_URL
echo $LANGSMITH_API_KEY
echo $NEXT_PUBLIC_ASSISTANT_ID
```

#### 4. 测试API代理
```bash
# 测试代理是否工作
curl http://localhost:3000/api/info
```

### 性能监控

#### 关键指标
- API代理响应时间
- 线程搜索延迟
- 消息流传输速度
- 错误率统计

#### 监控命令
```bash
# 实时查看日志
tail -f ~/.pm2/logs/agent-chat-ui-out.log

# 查看错误日志
tail -f ~/.pm2/logs/agent-chat-ui-error.log
```

## 升级指南

如果从公开配置升级到私有配置：

1. **备份现有配置**
2. **移除客户端的 `NEXT_PUBLIC_API_URL` 配置**
3. **设置服务端的 `LANGGRAPH_API_URL` 和 `LANGSMITH_API_KEY`**
4. **重新构建和部署应用**
5. **清除用户浏览器中的旧配置**
6. **验证所有功能正常工作**

## 联系支持

如有问题，请检查：
- 环境变量配置
- 网络连接
- 服务器日志
- LangGraph服务器状态

提供以下信息以便快速定位问题：
- 错误日志
- 浏览器控制台输出
- 网络请求详情
- 环境变量配置（请隐藏敏感信息）