import { Router } from "express";
import { ok } from "../middleware/error";
import { getUserId } from "../middleware/auth";
import { runSync, zSyncRequest } from "../services/syncService";

export const syncRouter = Router();

/**
 * 批量增量同步（App 主通路）：一次往返完成推送 + 拉取。
 * 请求：{ lastSyncedAt, push: { tasks, projects, ... } }
 * 响应：{ serverTime, applied, pull }
 * 客户端下次以 serverTime 作为 lastSyncedAt。
 */
syncRouter.post("/", async (req, res) => {
  const input = zSyncRequest.parse(req.body);
  res.json(ok(await runSync(getUserId(req), input)));
});
