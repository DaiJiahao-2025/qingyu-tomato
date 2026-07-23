// ============================================================
// 后端 API 客户端 —— 轻量 fetch 封装
// 自动附带 JWT；401 时触发登出回调（由 auth store 注册）。
// ============================================================

export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

let tokenProvider: () => string | null = () => null;
let onUnauthorized: (() => void) | null = null;

export function configureApi(options: { getToken: () => string | null; onUnauthorized?: () => void }): void {
  tokenProvider = options.getToken;
  onUnauthorized = options.onUnauthorized ?? null;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = tokenProvider();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(path, { ...init, headers });

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // 非 JSON 响应（网关错误页等）
  }

  if (res.status === 401) {
    onUnauthorized?.();
    throw new ApiRequestError(401, body?.message || "登录已过期");
  }
  if (!res.ok || !body || body.code !== 0) {
    throw new ApiRequestError(res.status, body?.message || `请求失败（${res.status}）`);
  }
  return body.data;
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path);
  },
  post<T>(path: string, data: unknown): Promise<T> {
    return request<T>(path, { method: "POST", body: JSON.stringify(data) });
  },
  put<T>(path: string, data: unknown): Promise<T> {
    return request<T>(path, { method: "PUT", body: JSON.stringify(data) });
  },
};

// ---- Auth 接口 ----

export interface CloudUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface AuthResult {
  token: string;
  user: CloudUser;
}

export function apiRegister(email: string, password: string, displayName?: string): Promise<AuthResult> {
  return api.post<AuthResult>("/api/auth/register", { email, password, displayName });
}

export function apiLogin(email: string, password: string): Promise<AuthResult> {
  return api.post<AuthResult>("/api/auth/login", { email, password });
}
