# API 接口文档

## 概述

本API基于FastAPI构建，用于数据库AI问答系统的后端服务。所有API端点都需要认证（除登录和注册外），使用Bearer Token进行身份验证。

**基础URL**: `http://localhost:8000` (默认端口)

**认证方式**: Bearer Token (通过 `/api/auth/login` 获取)

**数据格式**: JSON

## 认证相关接口

### 1. 用户登录
- **端点**: `POST /api/auth/login`
- **描述**: 用户登录获取访问令牌
- **请求体**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **响应**:
  ```json
  {
    "access_token": "string",
    "token_type": "bearer"
  }
  ```
- **状态码**: 200 (成功), 401 (凭据无效)

### 2. 用户注册
- **端点**: `POST /api/auth/register`
- **描述**: 注册新用户
- **请求体**:
  ```json
  {
    "username": "string",
    "password": "string",
    "email": "string (可选)"
  }
  ```
- **响应**:
  ```json
  {
    "message": "User {username} {id} registered successfully"
  }
  ```
- **状态码**: 200 (成功), 400 (用户名已存在)

## 数据源相关接口

### 3. 创建数据源
- **端点**: `POST /api/sources/`
- **描述**: 创建新的数据源连接
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "name": "string",
    "dialect": "postgresql|mysql|oracle|sqlite|csv|excel",
    "connection_details": {
      // 根据dialect不同，字段不同
      // PostgreSQL: user, password, host, port, database, schema
      // MySQL: user, password, host, port, database
      // SQLite: database (文件路径)
      // Oracle: user, password, host, port, database, schema
      // CSV: file_path, encoding, delimiter, header
      // Excel: file_path, sheet_name
    },
    "meta_data": {} // 可选的元数据
  }
  ```
- **响应**: 数据源详细信息 (见获取数据源)
- **状态码**: 201 (成功), 400 (验证失败), 401 (未认证)

### 4. 获取所有数据源
- **端点**: `GET /api/sources/`
- **描述**: 获取当前用户的所有数据源
- **请求头**: `Authorization: Bearer {token}`
- **响应**:
  ```json
  [
    {
      "id": 1,
      "name": "string",
      "dialect": "postgresql",
      "owner_id": 1,
      "tables_and_columns": {
        "table_name": ["column1", "column2"]
      },
      "available_tables_and_columns": {
        "table_name": ["column1", "column2"]
      },
      "meta_data": {}
    }
  ]
  ```
- **状态码**: 200 (成功), 401 (未认证)

### 5. 获取特定数据源
- **端点**: `GET /api/sources/{source_id}`
- **描述**: 根据ID获取数据源详情
- **请求头**: `Authorization: Bearer {token}`
- **响应**: 同上单个数据源对象
- **状态码**: 200 (成功), 403 (无权限), 404 (不存在)

### 6. 更新数据源
- **端点**: `PUT /api/sources/{source_id}`
- **描述**: 更新数据源信息
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "name": "string (可选)",
    "connection_details": {} (可选),
    "meta_data": {} (可选)
  }
  ```
- **响应**: 更新后的数据源对象
- **状态码**: 200 (成功), 400 (验证失败), 403 (无权限), 404 (不存在)

### 7. 更新数据源权限
- **端点**: `PUT /api/sources/{source_id}/permissions`
- **描述**: 更新数据源的可用表和列权限
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "available_tables_and_columns": {
      "table_name": ["column1", "column2"]
    }
  }
  ```
- **响应**: 更新后的数据源对象
- **状态码**: 200 (成功), 400 (无效权限), 403 (无权限), 404 (不存在)

### 8. 删除数据源
- **端点**: `DELETE /api/sources/{source_id}`
- **描述**: 删除数据源
- **请求头**: `Authorization: Bearer {token}`
- **响应**: 无内容
- **状态码**: 204 (成功), 403 (无权限), 404 (不存在)

## 记忆相关接口

### 9. 创建记忆
- **端点**: `POST /api/memories/`
- **描述**: 为数据源创建新的记忆条目
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "data_source_id": 1,
    "content": "string",
    "type": "database|table|column|other",
    "is_active": true,
    "meta_data": {} (可选)
  }
  ```
- **响应**: 创建的记忆对象
- **状态码**: 201 (成功), 403 (无权限), 404 (数据源不存在)

### 10. 获取数据源的所有记忆
- **端点**: `GET /api/memories/?data_source_id={id}`
- **描述**: 获取特定数据源的所有记忆
- **请求头**: `Authorization: Bearer {token}`
- **响应**:
  ```json
  [
    {
      "id": 1,
      "data_source_id": 1,
      "content": "string",
      "type": "database",
      "is_active": true,
      "meta_data": {}
    }
  ]
  ```
- **状态码**: 200 (成功), 403 (无权限), 404 (数据源不存在)

### 11. 获取特定记忆
- **端点**: `GET /api/memories/{memory_id}`
- **描述**: 根据ID获取记忆详情
- **请求头**: `Authorization: Bearer {token}`
- **响应**: 单个记忆对象
- **状态码**: 200 (成功), 403 (无权限), 404 (不存在)

### 12. 更新记忆
- **端点**: `PUT /api/memories/{memory_id}`
- **描述**: 更新记忆内容
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "content": "string (可选)",
    "is_active": true (可选),
    "meta_data": {} (可选)
  }
  ```
- **响应**: 更新后的记忆对象
- **状态码**: 200 (成功), 403 (无权限), 404 (不存在)

### 13. 删除记忆
- **端点**: `DELETE /api/memories/{memory_id}`
- **描述**: 删除记忆条目
- **请求头**: `Authorization: Bearer {token}`
- **响应**: 无内容
- **状态码**: 204 (成功), 403 (无权限), 404 (不存在)

## 系统相关接口

### 14. 健康检查
- **端点**: `GET /health`
- **描述**: 检查服务健康状态
- **响应**:
  ```json
  {
    "status": "healthy",
    "message": "数据库AI问答系统运行正常"
  }
  ```
- **状态码**: 200 (正常)

### 15. 根路径
- **端点**: `GET /`
- **描述**: 获取API基本信息
- **响应**:
  ```json
  {
    "message": "欢迎使用数据库AI问答系统",
    "docs": "/docs",
    "health": "/health"
  }
  ```
- **状态码**: 200 (正常)

## 错误响应格式

所有错误响应都遵循以下格式：

```json
{
  "detail": "错误描述信息"
}
```

## 注意事项

1. 所有需要认证的接口都必须在请求头中包含 `Authorization: Bearer {token}`
2. 数据源创建后会自动启动后台任务生成记忆，可能需要一些时间
3. 更新数据源连接信息时会重新生成记忆
4. 权限控制基于数据源的所有者，只有所有者可以操作自己的数据源和相关记忆
5. 支持的数据源类型包括PostgreSQL、MySQL、Oracle、SQLite、CSV、Excel