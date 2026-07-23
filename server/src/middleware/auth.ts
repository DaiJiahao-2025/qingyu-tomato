import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { ApiError } from "./error";

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError(401, "未登录");
  }
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret);
    if (typeof payload === "string" || typeof payload.sub !== "string") {
      throw new Error("bad payload");
    }
    req.userId = payload.sub;
  } catch {
    throw new ApiError(401, "登录已过期，请重新登录");
  }
  next();
}

/** 在受保护路由内取 userId（requireAuth 之后必然存在） */
export function getUserId(req: Request): string {
  if (!req.userId) throw new ApiError(401, "未登录");
  return req.userId;
}
