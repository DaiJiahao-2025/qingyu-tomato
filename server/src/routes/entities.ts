// RESTful 实体端点 —— 薄封装，全部复用 syncService 的 upsert/查询逻辑：
// 写入 = 服务端时间戳的单行 push；删除 = 推送墓碑行。

import { Router } from "express";
import { ok, ApiError } from "../middleware/error";
import { getUserId } from "../middleware/auth";
import * as sync from "../services/syncService";

export const entitiesRouter = Router();

function nowMs(): number {
  return Date.now();
}

// ---- Tasks ----

entitiesRouter.get("/tasks", async (req, res) => {
  res.json(ok(await sync.listTasks(getUserId(req))));
});

entitiesRouter.get("/tasks/:id", async (req, res) => {
  const task = await sync.getTask(getUserId(req), req.params.id);
  if (!task) throw new ApiError(404, "任务不存在");
  res.json(ok(task));
});

entitiesRouter.post("/tasks", async (req, res) => {
  const userId = getUserId(req);
  const row = sync.zTaskPush.parse({ ...req.body, updatedAt: nowMs(), deleted: undefined });
  await sync.applyPush(userId, emptyPush({ tasks: [row] }), new Date());
  res.status(201).json(ok(await sync.getTask(userId, row.id)));
});

entitiesRouter.put("/tasks/:id", async (req, res) => {
  const userId = getUserId(req);
  const row = sync.zTaskPush.parse({ ...req.body, id: req.params.id, updatedAt: nowMs(), deleted: undefined });
  await sync.applyPush(userId, emptyPush({ tasks: [row] }), new Date());
  res.json(ok(await sync.getTask(userId, row.id)));
});

entitiesRouter.delete("/tasks/:id", async (req, res) => {
  const userId = getUserId(req);
  const tombstone = sync.zTaskPush.parse({ id: req.params.id, updatedAt: nowMs(), deleted: true });
  await sync.applyPush(userId, emptyPush({ tasks: [tombstone] }), new Date());
  res.json(ok({ id: req.params.id, deleted: true }));
});

// ---- Projects ----

entitiesRouter.get("/projects", async (req, res) => {
  res.json(ok(await sync.listProjects(getUserId(req))));
});

entitiesRouter.post("/projects", async (req, res) => {
  const userId = getUserId(req);
  const row = sync.zProjectPush.parse({ ...req.body, updatedAt: nowMs(), deleted: undefined });
  await sync.applyPush(userId, emptyPush({ projects: [row] }), new Date());
  res.status(201).json(ok(row.id));
});

entitiesRouter.put("/projects/:id", async (req, res) => {
  const userId = getUserId(req);
  const row = sync.zProjectPush.parse({ ...req.body, id: req.params.id, updatedAt: nowMs(), deleted: undefined });
  await sync.applyPush(userId, emptyPush({ projects: [row] }), new Date());
  res.json(ok(row.id));
});

entitiesRouter.delete("/projects/:id", async (req, res) => {
  const userId = getUserId(req);
  const tombstone = sync.zProjectPush.parse({ id: req.params.id, updatedAt: nowMs(), deleted: true });
  await sync.applyPush(userId, emptyPush({ projects: [tombstone] }), new Date());
  res.json(ok({ id: req.params.id, deleted: true }));
});

// ---- Workspaces ----

entitiesRouter.get("/workspaces", async (req, res) => {
  res.json(ok(await sync.listWorkspaces(getUserId(req))));
});

entitiesRouter.put("/workspaces/:id", async (req, res) => {
  const userId = getUserId(req);
  const row = sync.zWorkspacePush.parse({ ...req.body, id: req.params.id, updatedAt: nowMs(), deleted: undefined });
  await sync.applyPush(userId, emptyPush({ workspaces: [row] }), new Date());
  res.json(ok(row.id));
});

// ---- Focus sessions（不可变，只有列表与追加） ----

entitiesRouter.get("/focus-sessions", async (req, res) => {
  res.json(ok(await sync.listSessions(getUserId(req))));
});

entitiesRouter.post("/focus-sessions", async (req, res) => {
  const userId = getUserId(req);
  const row = sync.zSessionPush.parse({ ...req.body, updatedAt: nowMs() });
  await sync.applyPush(userId, emptyPush({ focusSessions: [row] }), new Date());
  res.status(201).json(ok(row.id));
});

// ---- Settings ----

entitiesRouter.get("/settings", async (req, res) => {
  res.json(ok(await sync.getSettings(getUserId(req))));
});

entitiesRouter.put("/settings", async (req, res) => {
  const userId = getUserId(req);
  const row = sync.zSettingsPush.parse({ ...req.body, updatedAt: nowMs() });
  await sync.applyPush(userId, emptyPush({ settings: row }), new Date());
  res.json(ok(await sync.getSettings(userId)));
});

// ---- Character progress ----

entitiesRouter.get("/characters", async (req, res) => {
  res.json(ok(await sync.listCharacters(getUserId(req))));
});

entitiesRouter.put("/characters/:characterId", async (req, res) => {
  const userId = getUserId(req);
  const row = sync.zCharacterPush.parse({ ...req.body, characterId: req.params.characterId, updatedAt: nowMs() });
  await sync.applyPush(userId, emptyPush({ characters: [row] }), new Date());
  res.json(ok(row.characterId));
});

// ---- Gallery ----

entitiesRouter.get("/gallery", async (req, res) => {
  res.json(ok(await sync.listGallery(getUserId(req))));
});

entitiesRouter.post("/gallery", async (req, res) => {
  const userId = getUserId(req);
  const row = sync.zGalleryPush.parse({ ...req.body, updatedAt: nowMs() });
  await sync.applyPush(userId, emptyPush({ gallery: [row] }), new Date());
  res.status(201).json(ok(row.episodeId));
});

// ---- helpers ----

function emptyPush(partial: Partial<sync.SyncPush>): sync.SyncPush {
  return {
    workspaces: [],
    projects: [],
    tasks: [],
    focusSessions: [],
    characters: [],
    gallery: [],
    ...partial,
  };
}
