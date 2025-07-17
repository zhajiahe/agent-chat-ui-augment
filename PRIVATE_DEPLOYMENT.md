# 私有化部署指南

## 概述

该应用已配置为私有使用模式，LangGraph API地址不再暴露给客户端。所有API请求都通过内部代理服务器路由，提供更好的安全性。

## 架构说明

```
客户端 → Next.js内部代理 (/api/*) → LangGraph服务器
```

- **客户端**：只知道内部代理路径 `/api`
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

1. **"无法连接到服务器"**
   - 检查 `LANGGRAPH_API_URL` 是否正确
   - 验证网络连接
   - 检查LangGraph服务器状态

2. **"认证失败"**
   - 检查 `LANGSMITH_API_KEY` 是否有效
   - 验证API密钥权限

3. **"找不到助手"**
   - 检查 `NEXT_PUBLIC_ASSISTANT_ID` 配置
   - 验证助手ID是否存在

### 调试方法

1. 检查服务端日志：
```bash
# 查看Next.js服务端日志
pm2 logs agent-chat-ui
```

2. 检查网络请求：
```javascript
// 在浏览器控制台中检查请求
console.log('API requests should go to /api/*');
```

3. 验证环境变量：
```bash
# 在服务器上检查环境变量
echo $LANGGRAPH_API_URL
echo $LANGSMITH_API_KEY
```

## 升级指南

如果从公开配置升级到私有配置：

1. 移除客户端的 `NEXT_PUBLIC_API_URL` 配置
2. 设置服务端的 `LANGGRAPH_API_URL` 和 `LANGSMITH_API_KEY`
3. 重新构建和部署应用
4. 清除用户浏览器中的旧配置

## 联系支持

如有问题，请检查：
- 环境变量配置
- 网络连接
- 服务器日志
- LangGraph服务器状态