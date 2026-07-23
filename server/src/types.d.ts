declare global {
  namespace Express {
    interface Request {
      /** 由 requireAuth 中间件从 JWT 解出并挂载 */
      userId?: string;
    }
  }
}

export {};
