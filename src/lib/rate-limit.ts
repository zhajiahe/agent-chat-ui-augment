import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// 内存存储 - 生产环境建议使用Redis
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// 清理过期的计数器
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(key);
    }
  }
}

// 生成请求标识符
function getRequestKey(request: NextRequest, config: RateLimitConfig): string {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const windowKey = Math.floor(Date.now() / config.windowMs);

  return `${ip}:${userAgent}:${windowKey}`;
}

// 速率限制中间件
export function rateLimit(config: RateLimitConfig) {
  return async function (request: NextRequest): Promise<RateLimitResult> {
    // 清理过期条目
    cleanupExpiredEntries();

    const key = getRequestKey(request, config);
    const now = Date.now();
    const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
    const resetTime = windowStart + config.windowMs;

    // 获取当前计数
    let entry = requestCounts.get(key);

    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime };
      requestCounts.set(key, entry);
    }

    // 检查是否超过限制
    if (entry.count >= config.maxRequests) {
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime,
        retryAfter,
      };
    }

    // 增加计数
    entry.count++;

    return {
      success: true,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime,
    };
  };
}

// 预定义的速率限制配置
export const RATE_LIMITS = {
  // 严格限制 - 认证相关接口
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15分钟
    maxRequests: 5, // 每15分钟最多5次尝试
  },

  // 中等限制 - 数据库操作
  DATABASE: {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 10, // 每分钟最多10次
  },

  // 宽松限制 - 一般查询
  GENERAL: {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 60, // 每分钟最多60次
  },

  // 聊天消息 - 需要更宽松的限制
  CHAT: {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 120, // 每分钟最多120次
  },
} as const;

// 创建带速率限制的API响应
export function createRateLimitResponse(result: RateLimitResult): Response {
  const headers = new Headers({
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
    'Content-Type': 'application/json',
  });

  if (result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString());
  }

  return new Response(
    JSON.stringify({
      error: '请求过于频繁，请稍后再试',
      retry_after: result.retryAfter,
      limit: result.limit,
      remaining: result.remaining,
      reset_time: new Date(result.resetTime).toISOString(),
    }),
    {
      status: 429,
      headers,
    }
  );
}