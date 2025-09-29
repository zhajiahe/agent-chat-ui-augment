// 自定义应用错误类
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';

    // 保持堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
  }
}

// 预定义错误类型
export const ErrorCodes = {
  // 认证相关
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',

  // 数据源相关
  DATASOURCE_NOT_FOUND: 'DATASOURCE_NOT_FOUND',
  DATASOURCE_CONNECTION_FAILED: 'DATASOURCE_CONNECTION_FAILED',
  DATASOURCE_INVALID_CONFIG: 'DATASOURCE_INVALID_CONFIG',

  // 数据库相关
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR: 'DATABASE_QUERY_ERROR',
  DATABASE_URL_BUILD_ERROR: 'DATABASE_URL_BUILD_ERROR',

  // API相关
  API_RATE_LIMIT_EXCEEDED: 'API_RATE_LIMIT_EXCEEDED',
  API_INVALID_REQUEST: 'API_INVALID_REQUEST',
  API_SERVER_ERROR: 'API_SERVER_ERROR',

  // 网络相关
  NETWORK_ERROR: 'NETWORK_ERROR',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',

  // 验证相关
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // 外部服务相关
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  LANGGRAPH_ERROR: 'LANGGRAPH_ERROR',
} as const;

export type ErrorCode = keyof typeof ErrorCodes;

// 错误映射
const ErrorMessages: Record<string, string> = {
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: '用户名或密码错误',
  [ErrorCodes.AUTH_TOKEN_EXPIRED]: '登录已过期，请重新登录',
  [ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS]: '权限不足',

  [ErrorCodes.DATASOURCE_NOT_FOUND]: '数据源不存在',
  [ErrorCodes.DATASOURCE_CONNECTION_FAILED]: '数据源连接失败',
  [ErrorCodes.DATASOURCE_INVALID_CONFIG]: '数据源配置无效',

  [ErrorCodes.DATABASE_CONNECTION_ERROR]: '数据库连接错误',
  [ErrorCodes.DATABASE_QUERY_ERROR]: '数据库查询错误',
  [ErrorCodes.DATABASE_URL_BUILD_ERROR]: '数据库URL构建失败',

  [ErrorCodes.API_RATE_LIMIT_EXCEEDED]: '请求过于频繁，请稍后再试',
  [ErrorCodes.API_INVALID_REQUEST]: '请求参数无效',
  [ErrorCodes.API_SERVER_ERROR]: '服务器内部错误',

  [ErrorCodes.NETWORK_ERROR]: '网络连接错误',
  [ErrorCodes.NETWORK_TIMEOUT]: '网络请求超时',

  [ErrorCodes.VALIDATION_ERROR]: '数据验证失败',
  [ErrorCodes.MISSING_REQUIRED_FIELD]: '缺少必需字段',

  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: '外部服务错误',
  [ErrorCodes.LANGGRAPH_ERROR]: 'LangGraph服务错误',
};

// 状态码映射
const ErrorStatusCodes: Record<string, number> = {
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 401,
  [ErrorCodes.AUTH_TOKEN_EXPIRED]: 401,
  [ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS]: 403,

  [ErrorCodes.DATASOURCE_NOT_FOUND]: 404,
  [ErrorCodes.DATASOURCE_CONNECTION_FAILED]: 500,
  [ErrorCodes.DATASOURCE_INVALID_CONFIG]: 400,

  [ErrorCodes.DATABASE_CONNECTION_ERROR]: 500,
  [ErrorCodes.DATABASE_QUERY_ERROR]: 500,
  [ErrorCodes.DATABASE_URL_BUILD_ERROR]: 500,

  [ErrorCodes.API_RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCodes.API_INVALID_REQUEST]: 400,
  [ErrorCodes.API_SERVER_ERROR]: 500,

  [ErrorCodes.NETWORK_ERROR]: 0, // 客户端错误
  [ErrorCodes.NETWORK_TIMEOUT]: 0, // 客户端错误

  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 400,

  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorCodes.LANGGRAPH_ERROR]: 502,
};

// 创建标准错误
export function createError(
  code: ErrorCode,
  customMessage?: string,
  details?: Record<string, unknown>
): AppError {
  const message = customMessage || ErrorMessages[code] || '未知错误';
  const statusCode = ErrorStatusCodes[code] || 500;

  return new AppError(message, code, statusCode, true, details);
}

// 从未知错误创建AppError
export function createErrorFromUnknown(
  error: unknown,
  defaultCode: ErrorCode = ErrorCodes.API_SERVER_ERROR
): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      error.message,
      defaultCode,
      500,
      true,
      { originalError: error.name, stack: error.stack }
    );
  }

  return createError(defaultCode, String(error));
}

// 错误处理工具
export class ErrorHandler {
  // 处理API错误
  static handleAPIError(error: unknown, context?: string): AppError {
    const appError = createErrorFromUnknown(error);

    // 添加上下文信息
    if (context) {
      appError.message = `${context}: ${appError.message}`;
    }

    // 记录错误日志
    console.error(`API Error [${appError.code}]:`, {
      message: appError.message,
      statusCode: appError.statusCode,
      details: appError.details,
      stack: appError.stack,
    });

    return appError;
  }

  // 创建HTTP响应
  static createHTTPResponse(error: AppError): Response {
    const isDevelopment = process.env.NODE_ENV === 'development';

    const responseBody = {
      error: error.message,
      code: error.code,
      ...(isDevelopment && {
        details: error.details,
        stack: error.stack,
      }),
    };

    return new Response(
      JSON.stringify(responseBody),
      {
        status: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // 检查是否为可操作错误
  static isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }
}

// 全局错误处理器中间件
export function withErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = ErrorHandler.handleAPIError(error);
      throw appError;
    }
  };
}