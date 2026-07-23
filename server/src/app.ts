import express from "express";
import cors from "cors";
import { errorHandler, ok } from "./middleware/error";
import { requireAuth } from "./middleware/auth";
import { authRouter } from "./routes/auth";
import { entitiesRouter } from "./routes/entities";
import { syncRouter } from "./routes/sync";

/** 应用工厂 —— 供 index.ts 启动与 Supertest 直接测试 */
export function createApp() {
  const app = express();
  app.use(cors());
  // 首次全量上传可能带数千条专注记录，放宽 body 限制
  app.use(express.json({ limit: "10mb" }));

  app.get("/api/health", (_req, res) => {
    res.json(ok({ status: "up" }));
  });

  app.use("/api/auth", authRouter);
  app.use("/api/sync", requireAuth, syncRouter);
  app.use("/api", requireAuth, entitiesRouter);

  app.use(errorHandler);
  return app;
}
