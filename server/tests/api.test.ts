import { beforeEach, afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";

const app = createApp();

async function registerAndGetToken(email: string): Promise<string> {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email, password: "secret123", displayName: "测试用户" });
  expect(res.status).toBe(201);
  return res.body.data.token;
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function taskRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "task_1",
    workspaceId: "workspace_personal",
    projectId: null,
    title: "写周报",
    description: "整理本周进展",
    status: "todo",
    priority: "high",
    estimatedPomodoros: 2,
    completedPomodoros: 0,
    createdAt: "2026-07-22T10:00:00.000Z",
    completedAt: null,
    updatedAt: 2000,
    ...overrides,
  };
}

beforeEach(async () => {
  // 级联删除所有业务数据
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("auth", () => {
  it("注册后可登录并获取当前用户", async () => {
    await registerAndGetToken("a@test.com");

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@test.com", password: "secret123" });
    expect(login.status).toBe(200);
    expect(login.body.data.token).toBeTruthy();

    const me = await request(app).get("/api/auth/me").set(auth(login.body.data.token));
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe("a@test.com");
    expect(me.body.data.displayName).toBe("测试用户");
  });

  it("重复注册返回 409，错误密码返回 401", async () => {
    await registerAndGetToken("a@test.com");
    const dup = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@test.com", password: "secret123" });
    expect(dup.status).toBe(409);

    const bad = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@test.com", password: "wrong-password" });
    expect(bad.status).toBe(401);
  });

  it("无 token 访问受保护接口返回 401", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
  });

  it("参数错误返回 400", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "not-an-email", password: "1" });
    expect(res.status).toBe(400);
  });
});

describe("task REST CRUD", () => {
  it("创建、更新、删除任务", async () => {
    const token = await registerAndGetToken("a@test.com");

    const created = await request(app).post("/api/tasks").set(auth(token)).send(taskRow());
    expect(created.status).toBe(201);
    expect(created.body.data.title).toBe("写周报");

    const updated = await request(app)
      .put("/api/tasks/task_1")
      .set(auth(token))
      .send(taskRow({ title: "写月报", status: "doing" }));
    expect(updated.body.data.title).toBe("写月报");
    expect(updated.body.data.status).toBe("doing");

    const del = await request(app).delete("/api/tasks/task_1").set(auth(token));
    expect(del.status).toBe(200);

    const list = await request(app).get("/api/tasks").set(auth(token));
    expect(list.body.data).toEqual([]);

    const missing = await request(app).get("/api/tasks/task_1").set(auth(token));
    expect(missing.status).toBe(404);
  });
});

describe("sync", () => {
  it("推送后按增量拉取，重复推送幂等", async () => {
    const token = await registerAndGetToken("a@test.com");

    const first = await request(app)
      .post("/api/sync")
      .set(auth(token))
      .send({ lastSyncedAt: 0, push: { tasks: [taskRow()] } });
    expect(first.status).toBe(200);
    expect(first.body.data.applied.tasks).toBe(1);
    // 自身刚推送的行不在本次 pull 中回显
    expect(first.body.data.pull.tasks).toEqual([]);

    // 相同 updatedAt 重复推送 → 幂等跳过
    const again = await request(app)
      .post("/api/sync")
      .set(auth(token))
      .send({ lastSyncedAt: 0, push: { tasks: [taskRow()] } });
    expect(again.body.data.applied.tasks).toBe(0);
    // lastSyncedAt=0 的全量拉取能拿到该行
    expect(again.body.data.pull.tasks).toHaveLength(1);
    expect(again.body.data.pull.tasks[0].title).toBe("写周报");

    // 以 serverTime 为游标的下一次拉取不再返回旧行
    const cursor = again.body.data.serverTime;
    const incremental = await request(app)
      .post("/api/sync")
      .set(auth(token))
      .send({ lastSyncedAt: cursor, push: {} });
    expect(incremental.body.data.pull.tasks).toEqual([]);
  });

  it("LWW：旧时间戳不覆盖新数据，新时间戳覆盖", async () => {
    const token = await registerAndGetToken("a@test.com");
    const push = (row: Record<string, unknown>) =>
      request(app).post("/api/sync").set(auth(token)).send({ lastSyncedAt: 0, push: { tasks: [row] } });

    await push(taskRow({ title: "版本A", updatedAt: 2000 }));
    const stale = await push(taskRow({ title: "过期版本", updatedAt: 1000 }));
    expect(stale.body.data.applied.tasks).toBe(0);
    expect(stale.body.data.pull.tasks[0].title).toBe("版本A");

    const newer = await push(taskRow({ title: "版本C", updatedAt: 3000 }));
    expect(newer.body.data.applied.tasks).toBe(1);

    const check = await request(app).get("/api/tasks/task_1").set(auth(token));
    expect(check.body.data.title).toBe("版本C");
    expect(check.body.data.updatedAt).toBe(3000);
  });

  it("墓碑删除同步下发，且更新的时间戳可复活行", async () => {
    const token = await registerAndGetToken("a@test.com");
    await request(app)
      .post("/api/sync")
      .set(auth(token))
      .send({ lastSyncedAt: 0, push: { tasks: [taskRow({ updatedAt: 1000 })] } });

    // 推送墓碑
    await request(app)
      .post("/api/sync")
      .set(auth(token))
      .send({ lastSyncedAt: 0, push: { tasks: [{ id: "task_1", deleted: true, updatedAt: 2000 }] } });

    const list = await request(app).get("/api/tasks").set(auth(token));
    expect(list.body.data).toEqual([]);

    const pulled = await request(app).post("/api/sync").set(auth(token)).send({ lastSyncedAt: 0, push: {} });
    expect(pulled.body.data.pull.tasks[0].deleted).toBe(true);

    // 更新的时间戳复活该行
    await request(app)
      .post("/api/sync")
      .set(auth(token))
      .send({ lastSyncedAt: 0, push: { tasks: [taskRow({ title: "复活", updatedAt: 3000 })] } });
    const revived = await request(app).get("/api/tasks/task_1").set(auth(token));
    expect(revived.body.data.title).toBe("复活");
  });

  it("角色进度按字段取 max、剧集取并集，不互吞进度", async () => {
    const token = await registerAndGetToken("a@test.com");
    const push = (row: Record<string, unknown>) =>
      request(app).post("/api/sync").set(auth(token)).send({ lastSyncedAt: 0, push: { characters: [row] } });

    await push({ characterId: "suisui_001", completedPomodoros: 3, storyProgress: 3, unlockedEpisodeIds: ["ep1", "ep2"], updatedAt: 2000 });
    // 另一台设备：storyProgress 更高但 completedPomodoros 更低、时间戳更旧
    await push({ characterId: "suisui_001", completedPomodoros: 2, storyProgress: 5, unlockedEpisodeIds: ["ep3"], updatedAt: 1000 });

    const res = await request(app).get("/api/characters").set(auth(token));
    const progress = res.body.data[0];
    expect(progress.completedPomodoros).toBe(3);
    expect(progress.storyProgress).toBe(5);
    expect(progress.unlockedEpisodeIds).toEqual(["ep1", "ep2", "ep3"]);
  });

  it("专注记录批量插入幂等（游客全量上传场景）", async () => {
    const token = await registerAndGetToken("a@test.com");
    const sessions = Array.from({ length: 120 }, (_, i) => ({
      id: `focus_${i}`,
      workspaceId: "workspace_personal",
      taskId: null,
      characterId: "suisui_001",
      taskText: `任务 ${i}`,
      focusMinutes: 25,
      startedAt: "2026-07-22T10:00:00.000Z",
      completedAt: "2026-07-22T10:25:00.000Z",
      status: "completed",
      updatedAt: 1000 + i,
    }));

    const first = await request(app)
      .post("/api/sync")
      .set(auth(token))
      .send({ lastSyncedAt: 0, push: { focusSessions: sessions } });
    expect(first.body.data.applied.focusSessions).toBe(120);

    const again = await request(app)
      .post("/api/sync")
      .set(auth(token))
      .send({ lastSyncedAt: 0, push: { focusSessions: sessions } });
    expect(again.body.data.applied.focusSessions).toBe(0);
  });

  it("用户之间数据完全隔离", async () => {
    const tokenA = await registerAndGetToken("a@test.com");
    const tokenB = await registerAndGetToken("b@test.com");

    await request(app)
      .post("/api/sync")
      .set(auth(tokenA))
      .send({ lastSyncedAt: 0, push: { tasks: [taskRow()] } });

    const pullB = await request(app).post("/api/sync").set(auth(tokenB)).send({ lastSyncedAt: 0, push: {} });
    expect(pullB.body.data.pull.tasks).toEqual([]);

    const listB = await request(app).get("/api/tasks").set(auth(tokenB));
    expect(listB.body.data).toEqual([]);

    // 相同行 id 在不同用户下互不冲突
    await request(app)
      .post("/api/sync")
      .set(auth(tokenB))
      .send({ lastSyncedAt: 0, push: { tasks: [taskRow({ title: "B的任务" })] } });
    const listA = await request(app).get("/api/tasks").set(auth(tokenA));
    expect(listA.body.data[0].title).toBe("写周报");
  });

  it("设置 LWW 同步", async () => {
    const token = await registerAndGetToken("a@test.com");
    const settings = {
      defaultFocusMinutes: 30,
      breakMinutes: 10,
      musicId: "cafe_001",
      voiceVolume: 0.5,
      musicVolume: 0.4,
      muted: true,
      currentCharacterId: "yaya_001",
      currentWorkspaceId: "workspace_personal",
    };
    await request(app)
      .post("/api/sync")
      .set(auth(token))
      .send({ lastSyncedAt: 0, push: { settings: { ...settings, updatedAt: 2000 } } });
    // 旧时间戳不覆盖
    await request(app)
      .post("/api/sync")
      .set(auth(token))
      .send({ lastSyncedAt: 0, push: { settings: { ...settings, defaultFocusMinutes: 45, updatedAt: 1000 } } });

    const res = await request(app).get("/api/settings").set(auth(token));
    expect(res.body.data.defaultFocusMinutes).toBe(30);
    expect(res.body.data.muted).toBe(true);
  });
});
