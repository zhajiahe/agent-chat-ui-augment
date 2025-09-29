"use client";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type LoginRequest = { username: string; password: string };
export type LoginResponse = { access_token: string; token_type: string };

export type RegisterRequest = {
  username: string;
  password: string;
  email?: string;
};

export type UserResponse = {
  id: number;
  username: string;
  email?: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  meta_data?: Record<string, unknown> | null;
};

export type DataSource = {
  id: number;
  name: string;
  dialect: "postgresql" | "mysql" | "oracle" | "sqlite" | "csv" | "excel";
  owner_id?: number;
  connection_details?: Record<string, unknown>;
  tables_and_columns?: Record<string, string[]>;
  available_tables_and_columns?: Record<string, string[]>;
  meta_data?: Record<string, unknown>;
};

export type CreateDataSourceRequest = {
  name: string;
  dialect: DataSource["dialect"];
  connection_details: Record<string, unknown>;
  meta_data?: Record<string, unknown>;
};

export type UpdateDataSourceRequest = Partial<CreateDataSourceRequest>;

export type Memory = {
  id: number;
  data_source_id: number;
  content: string;
  type: "database" | "table" | "column" | "other";
  is_active: boolean;
  meta_data?: Record<string, unknown>;
};

export type CreateMemoryRequest = {
  data_source_id: number;
  content: string;
  type: Memory["type"];
  is_active: boolean;
  meta_data?: Record<string, unknown>;
};

export type UpdateMemoryRequest = Partial<Omit<CreateMemoryRequest, "data_source_id">>;

const getBaseUrl = (): string => {
  // Always go through internal proxy to keep server URL private
  if (typeof window !== "undefined") return `${window.location.origin}/backend`;
  return "/backend";
};

const getAuthToken = (): string | null => {
  try {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("backend_access_token");
  } catch {
    return null;
  }
};

async function request<T>(path: string, options: { method?: HttpMethod; body?: unknown; auth?: boolean; isFormUrlEncoded?: boolean } = {}): Promise<T> {
  const base = getBaseUrl();
  const headers: Record<string, string> = {};

  // Set content type based on format
  if (options.isFormUrlEncoded) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  } else {
    headers["Content-Type"] = "application/json";
  }

  if (options.auth) {
    const token = getAuthToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let body: string | undefined;
  if (options.body) {
    if (options.isFormUrlEncoded) {
      // Convert object to form-urlencoded format
      const params = new URLSearchParams();
      const bodyObj = options.body as Record<string, any>;
      Object.entries(bodyObj).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      body = params.toString();
    } else {
      body = JSON.stringify(options.body);
    }
  }

  const res = await fetch(`${base}${path}`.replace(/\/+$/, ""), {
    method: options.method ?? "GET",
    headers,
    ...(body ? { body } : {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export const backendApi = {
  // Auth
  login: (payload: LoginRequest) => request<LoginResponse>(`/api/auth/login`, {
    method: "POST",
    body: { ...payload, grant_type: "password" },
    isFormUrlEncoded: true
  }),
  register: (payload: RegisterRequest) => request<{ message: string }>(`/api/auth/register`, { method: "POST", body: payload }),
  getCurrentUser: () => request<UserResponse>(`/api/auth/me`, { auth: true }),

  // Data Sources
  createSource: (payload: CreateDataSourceRequest) =>
    request<DataSource>(`/api/sources/`, { method: "POST", body: payload, auth: true }),
  listSources: () => request<DataSource[]>(`/api/sources/`, { auth: true }),
  getSource: (id: number) => request<DataSource>(`/api/sources/${id}`, { auth: true }),
  updateSource: (id: number, payload: UpdateDataSourceRequest) =>
    request<DataSource>(`/api/sources/${id}`, { method: "PUT", body: payload, auth: true }),
  deleteSource: (id: number) => request<void>(`/api/sources/${id}`, { method: "DELETE", auth: true }),

  // Memories
  listMemories: (dataSourceId: number) => request<Memory[]>(`/api/memories/?data_source_id=${dataSourceId}`, { auth: true }),
  createMemory: (payload: CreateMemoryRequest) =>
    request<Memory>(`/api/memories/`, { method: "POST", body: payload, auth: true }),
  updateMemory: (id: number, payload: UpdateMemoryRequest) =>
    request<Memory>(`/api/memories/${id}`, { method: "PUT", body: payload, auth: true }),
  deleteMemory: (id: number) => request<void>(`/api/memories/${id}`, { method: "DELETE", auth: true }),
};

export function buildDbUrlFromSource(ds: DataSource): string | null {
  const d = ds.dialect;
  const c = (ds.connection_details || {}) as Record<string, any>;
  try {
    if (d === "sqlite") {
      const p = c.database as string;
      return p ? `sqlite:///${p}` : null;
    }
    if (d === "postgresql") {
      const user = encodeURIComponent(c.user || "");
      const pass = encodeURIComponent(c.password || "");
      const host = c.host || "localhost";
      const port = c.port || 5432;
      const db = c.database || "postgres";
      const schema = c.schema ? `?schema=${encodeURIComponent(c.schema)}` : "";
      return `postgresql://${user}:${pass}@${host}:${port}/${db}${schema}`;
    }
    if (d === "mysql") {
      const user = encodeURIComponent(c.user || "");
      const pass = encodeURIComponent(c.password || "");
      const host = c.host || "localhost";
      const port = c.port || 3306;
      const db = c.database || "mysql";
      return `mysql://${user}:${pass}@${host}:${port}/${db}`;
    }
    if (d === "oracle") {
      const user = encodeURIComponent(c.user || "");
      const pass = encodeURIComponent(c.password || "");
      const host = c.host || "localhost";
      const port = c.port || 1521;
      const db = c.database || "xe";
      const schema = c.schema ? `?schema=${encodeURIComponent(c.schema)}` : "";
      return `oracle://${user}:${pass}@${host}:${port}/${db}${schema}`;
    }
    if (d === "csv") {
      const path = c.file_path as string;
      return path ? `csv://${path}` : null;
    }
    if (d === "excel") {
      const path = c.file_path as string;
      const sheet = c.sheet_name ? `?sheet=${encodeURIComponent(c.sheet_name)}` : "";
      return path ? `excel://${path}${sheet}` : null;
    }
    return null;
  } catch {
    return null;
  }
}


