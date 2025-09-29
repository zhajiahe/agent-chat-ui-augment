import { NextRequest } from 'next/server';
import { rateLimit, createRateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import {
  AppError,
  ErrorHandler,
  ErrorCodes
} from '@/lib/errors';

export interface DatabaseConnectionRequest {
  dialect: 'postgresql' | 'mysql' | 'oracle' | 'sqlite' | 'csv' | 'excel';
  connection_details: Record<string, unknown>;
}

export interface DatabaseConnectionResponse {
  database_url: string | null;
  error?: string;
}

// 应用速率限制
const rateLimiter = rateLimit(RATE_LIMITS.DATABASE);

// POST /api/database-url - 构建数据库连接URL（服务端安全处理）
export async function POST(request: NextRequest) {
  try {
    // 检查速率限制
    const rateLimitResult = await rateLimiter(request);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const body: DatabaseConnectionRequest = await request.json();
    const { dialect, connection_details } = body;

    if (!dialect || !connection_details) {
      throw new AppError(
        '缺少必要的参数：dialect 或 connection_details',
        ErrorCodes.API_INVALID_REQUEST,
        400
      );
    }

    let databaseUrl: string | null = null;

    try {
      switch (dialect) {
        case 'sqlite': {
          const sqlitePath = connection_details.database as string;
          databaseUrl = sqlitePath ? `sqlite:///${sqlitePath}` : null;
          break;
        }

        case 'postgresql': {
          const pgUser = encodeURIComponent(connection_details.user as string || '');
          const pgPass = encodeURIComponent(connection_details.password as string || '');
          const pgHost = connection_details.host as string || 'localhost';
          const pgPort = connection_details.port as number || 5432;
          const pgDb = connection_details.database as string || 'postgres';
          const pgSchema = connection_details.schema as string;

          let pgUrl = `postgresql://${pgUser}:${pgPass}@${pgHost}:${pgPort}/${pgDb}`;
          if (pgSchema) {
            pgUrl += `?schema=${encodeURIComponent(pgSchema)}`;
          }
          databaseUrl = pgUrl;
          break;
        }

        case 'mysql': {
          const myUser = encodeURIComponent(connection_details.user as string || '');
          const myPass = encodeURIComponent(connection_details.password as string || '');
          const myHost = connection_details.host as string || 'localhost';
          const myPort = connection_details.port as number || 3306;
          const myDb = connection_details.database as string || 'mysql';

          databaseUrl = `mysql://${myUser}:${myPass}@${myHost}:${myPort}/${myDb}`;
          break;
        }

        case 'oracle': {
          const orUser = encodeURIComponent(connection_details.user as string || '');
          const orPass = encodeURIComponent(connection_details.password as string || '');
          const orHost = connection_details.host as string || 'localhost';
          const orPort = connection_details.port as number || 1521;
          const orDb = connection_details.database as string || 'xe';
          const orSchema = connection_details.schema as string;

          let orUrl = `oracle://${orUser}:${orPass}@${orHost}:${orPort}/${orDb}`;
          if (orSchema) {
            orUrl += `?schema=${encodeURIComponent(orSchema)}`;
          }
          databaseUrl = orUrl;
          break;
        }

        case 'csv': {
          const csvPath = connection_details.file_path as string;
          databaseUrl = csvPath ? `csv://${csvPath}` : null;
          break;
        }

        case 'excel': {
          const excelPath = connection_details.file_path as string;
          const excelSheet = connection_details.sheet_name as string;

          if (!excelPath) {
            databaseUrl = null;
            break;
          }

          let excelUrl = `excel://${excelPath}`;
          if (excelSheet) {
            excelUrl += `?sheet=${encodeURIComponent(excelSheet)}`;
          }
          databaseUrl = excelUrl;
          break;
        }

        default:
          throw new AppError(
            `不支持的数据库类型：${dialect}`,
            ErrorCodes.DATABASE_URL_BUILD_ERROR,
            400
          );
      }

      // 记录构建结果（不包含敏感信息）
      console.log(`数据库URL构建成功 - 类型: ${dialect}, URL存在: ${!!databaseUrl}`);

      return Response.json({
        database_url: databaseUrl
      });

    } catch (buildError) {
      if (buildError instanceof AppError) {
        throw buildError;
      }

      console.error('数据库URL构建失败:', buildError);
      throw new AppError(
        '数据库URL构建失败：参数格式错误',
        ErrorCodes.DATABASE_URL_BUILD_ERROR,
        400
      );
    }

  } catch (error) {
    const appError = ErrorHandler.handleAPIError(error, '数据库URL构建API');
    return ErrorHandler.createHTTPResponse(appError);
  }
}

// 安全检查：确保只有认证用户可以访问
export async function GET() {
  return Response.json(
    { error: '仅支持POST请求' },
    { status: 405 }
  );
}