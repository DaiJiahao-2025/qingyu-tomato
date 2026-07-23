import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** 统一成功响应包装 */
export function ok<T>(data: T) {
  return { code: 0, message: "ok", data };
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ code: err.status, message: err.message });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      code: 400,
      message: "参数错误",
      detail: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
    return;
  }
  console.error("[unhandled]", err);
  res.status(500).json({ code: 500, message: "服务器内部错误" });
}
