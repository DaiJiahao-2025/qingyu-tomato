// ============================================================
// 同步服务 —— 所有写入的唯一通路
//
// REST 单行写入与 POST /api/sync 批量推送共用同一套 upsert 逻辑：
// - 普通实体（workspace/project/task/gallery/settings）：LWW，
//   client.updatedAt 更新者胜，相等视为已同步（幂等跳过）。
// - CharacterProgress：不用 LWW —— 进度计数按字段取 max、
//   已解锁剧集取并集，防止两台离线设备互吞进度。
// - FocusSession：近似 append-only，createMany + skipDuplicates 批量插入。
// - 删除以墓碑（deletedAt）表示，拉取时下发 deleted 标记。
// - updatedAt 为客户端时钟（冲突判定），syncedAt 为服务端时钟（拉取游标）。
// ============================================================

import type { Prisma, TaskStatus, TaskPriority, SessionStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma";

// ---- 推送 payload 校验 ----
// 内容字段都带默认值，使墓碑行 { id, deleted: true, updatedAt } 也能通过校验。

const zTs = z.number().int().nonnegative();
const zId = z.string().min(1).max(191);
const zDateStr = z.string().max(64);

export const zWorkspacePush = z.object({
  id: zId,
  name: z.string().max(255).default(""),
  updatedAt: zTs,
  deleted: z.boolean().optional(),
});

export const zProjectPush = z.object({
  id: zId,
  workspaceId: zId.default("workspace_personal"),
  name: z.string().max(255).default(""),
  color: z.string().max(32).default(""),
  createdAt: zDateStr.default(""),
  updatedAt: zTs,
  deleted: z.boolean().optional(),
});

export const zTaskPush = z.object({
  id: zId,
  workspaceId: zId.default("workspace_personal"),
  projectId: z.string().max(191).nullable().default(null),
  title: z.string().max(500).default(""),
  description: z.string().max(10000).default(""),
  status: z.enum(["todo", "doing", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  estimatedPomodoros: z.number().int().min(0).max(1000).default(1),
  completedPomodoros: z.number().int().min(0).max(100000).default(0),
  createdAt: zDateStr.default(""),
  completedAt: zDateStr.nullable().default(null),
  updatedAt: zTs,
  deleted: z.boolean().optional(),
});

export const zSessionPush = z.object({
  id: zId,
  workspaceId: zId.default("workspace_personal"),
  taskId: z.string().max(191).nullable().default(null),
  characterId: z.string().max(64).default(""),
  taskText: z.string().max(2000).default(""),
  focusMinutes: z.number().int().min(0).max(24 * 60).default(25),
  startedAt: zDateStr.default(""),
  completedAt: zDateStr.default(""),
  status: z.enum(["completed", "cancelled"]).default("completed"),
  updatedAt: zTs,
});

export const zSettingsPush = z.object({
  defaultFocusMinutes: z.number().int().min(1).max(240).default(25),
  breakMinutes: z.number().int().min(1).max(120).default(5),
  musicId: z.string().max(64).default("rain_001"),
  voiceVolume: z.number().min(0).max(1).default(0.7),
  musicVolume: z.number().min(0).max(1).default(0.25),
  muted: z.boolean().default(false),
  currentCharacterId: z.string().max(64).default("suisui_001"),
  currentWorkspaceId: z.string().max(191).default("workspace_personal"),
  updatedAt: zTs,
});

export const zCharacterPush = z.object({
  characterId: z.string().min(1).max(64),
  completedPomodoros: z.number().int().min(0).max(1000000).default(0),
  storyProgress: z.number().int().min(0).max(1000000).default(0),
  unlockedEpisodeIds: z.array(z.string().max(64)).max(10000).default([]),
  updatedAt: zTs,
});

export const zGalleryPush = z.object({
  episodeId: z.string().min(1).max(64),
  characterId: z.string().max(64).default(""),
  characterName: z.string().max(255).default(""),
  title: z.string().max(255).default(""),
  unlockText: z.string().max(5000).default(""),
  unlockedAt: zDateStr.default(""),
  taskText: z.string().max(2000).default(""),
  updatedAt: zTs,
});

export const zSyncRequest = z.object({
  lastSyncedAt: zTs.default(0),
  push: z
    .object({
      workspaces: z.array(zWorkspacePush).max(1000).default([]),
      projects: z.array(zProjectPush).max(2000).default([]),
      tasks: z.array(zTaskPush).max(5000).default([]),
      focusSessions: z.array(zSessionPush).max(20000).default([]),
      settings: zSettingsPush.optional(),
      characters: z.array(zCharacterPush).max(100).default([]),
      gallery: z.array(zGalleryPush).max(2000).default([]),
    })
    .default({ workspaces: [], projects: [], tasks: [], focusSessions: [], characters: [], gallery: [] }),
});

export type WorkspacePush = z.infer<typeof zWorkspacePush>;
export type ProjectPush = z.infer<typeof zProjectPush>;
export type TaskPush = z.infer<typeof zTaskPush>;
export type SessionPush = z.infer<typeof zSessionPush>;
export type SettingsPush = z.infer<typeof zSettingsPush>;
export type CharacterPush = z.infer<typeof zCharacterPush>;
export type GalleryPush = z.infer<typeof zGalleryPush>;
export type SyncRequest = z.infer<typeof zSyncRequest>;
export type SyncPush = SyncRequest["push"];

type Tx = Prisma.TransactionClient;

function chunk<T>(rows: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

// ---- 单行 upsert（LWW） ----

async function upsertWorkspace(tx: Tx, userId: string, row: WorkspacePush, now: Date): Promise<boolean> {
  const where = { userId_id: { userId, id: row.id } };
  const existing = await tx.workspace.findUnique({ where, select: { updatedAt: true } });
  if (existing && existing.updatedAt.getTime() >= row.updatedAt) return false;
  const updatedAt = new Date(row.updatedAt);
  const data = { name: row.name, updatedAt, syncedAt: now, deletedAt: row.deleted ? updatedAt : null };
  await tx.workspace.upsert({ where, create: { userId, id: row.id, ...data }, update: data });
  return true;
}

async function upsertProject(tx: Tx, userId: string, row: ProjectPush, now: Date): Promise<boolean> {
  const where = { userId_id: { userId, id: row.id } };
  const existing = await tx.project.findUnique({ where, select: { updatedAt: true } });
  if (existing && existing.updatedAt.getTime() >= row.updatedAt) return false;
  const updatedAt = new Date(row.updatedAt);
  const data = {
    workspaceId: row.workspaceId,
    name: row.name,
    color: row.color,
    createdAt: row.createdAt,
    updatedAt,
    syncedAt: now,
    deletedAt: row.deleted ? updatedAt : null,
  };
  await tx.project.upsert({ where, create: { userId, id: row.id, ...data }, update: data });
  return true;
}

async function upsertTask(tx: Tx, userId: string, row: TaskPush, now: Date): Promise<boolean> {
  const where = { userId_id: { userId, id: row.id } };
  const existing = await tx.task.findUnique({ where, select: { updatedAt: true } });
  if (existing && existing.updatedAt.getTime() >= row.updatedAt) return false;
  const updatedAt = new Date(row.updatedAt);
  const data = {
    workspaceId: row.workspaceId,
    projectId: row.projectId,
    title: row.title,
    description: row.description,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    estimatedPomodoros: row.estimatedPomodoros,
    completedPomodoros: row.completedPomodoros,
    createdAt: row.createdAt,
    completedAt: row.completedAt,
    updatedAt,
    syncedAt: now,
    deletedAt: row.deleted ? updatedAt : null,
  };
  await tx.task.upsert({ where, create: { userId, id: row.id, ...data }, update: data });
  return true;
}

async function upsertSettings(tx: Tx, userId: string, row: SettingsPush, now: Date): Promise<boolean> {
  const existing = await tx.userSettings.findUnique({ where: { userId }, select: { updatedAt: true } });
  if (existing && existing.updatedAt.getTime() >= row.updatedAt) return false;
  const { updatedAt, ...fields } = row;
  const data = { ...fields, updatedAt: new Date(updatedAt), syncedAt: now };
  await tx.userSettings.upsert({ where: { userId }, create: { userId, ...data }, update: data });
  return true;
}

async function upsertCharacter(tx: Tx, userId: string, row: CharacterPush, now: Date): Promise<boolean> {
  const where = { userId_characterId: { userId, characterId: row.characterId } };
  const existing = await tx.characterProgress.findUnique({ where });
  if (!existing) {
    await tx.characterProgress.create({
      data: {
        userId,
        characterId: row.characterId,
        completedPomodoros: row.completedPomodoros,
        storyProgress: row.storyProgress,
        unlockedEpisodeIds: row.unlockedEpisodeIds,
        updatedAt: new Date(row.updatedAt),
        syncedAt: now,
      },
    });
    return true;
  }
  const existingIds = Array.isArray(existing.unlockedEpisodeIds) ? (existing.unlockedEpisodeIds as string[]) : [];
  const mergedIds = [...existingIds];
  for (const id of row.unlockedEpisodeIds) {
    if (!mergedIds.includes(id)) mergedIds.push(id);
  }
  const completedPomodoros = Math.max(existing.completedPomodoros, row.completedPomodoros);
  const storyProgress = Math.max(existing.storyProgress, row.storyProgress);
  const unchanged =
    completedPomodoros === existing.completedPomodoros &&
    storyProgress === existing.storyProgress &&
    mergedIds.length === existingIds.length;
  // 内容无变化就不推进 syncedAt，避免其它设备反复拉到相同行
  if (unchanged) return false;
  await tx.characterProgress.update({
    where,
    data: {
      completedPomodoros,
      storyProgress,
      unlockedEpisodeIds: mergedIds,
      updatedAt: new Date(Math.max(existing.updatedAt.getTime(), row.updatedAt)),
      syncedAt: now,
    },
  });
  return true;
}

async function upsertGallery(tx: Tx, userId: string, row: GalleryPush, now: Date): Promise<boolean> {
  const where = { userId_episodeId: { userId, episodeId: row.episodeId } };
  const existing = await tx.galleryEntry.findUnique({ where, select: { updatedAt: true } });
  if (existing && existing.updatedAt.getTime() >= row.updatedAt) return false;
  const { episodeId, updatedAt, ...fields } = row;
  const data = { ...fields, updatedAt: new Date(updatedAt), syncedAt: now };
  await tx.galleryEntry.upsert({ where, create: { userId, episodeId, ...data }, update: data });
  return true;
}

// ---- 批量推送 ----

export interface AppliedCounts {
  workspaces: number;
  projects: number;
  tasks: number;
  focusSessions: number;
  settings: number;
  characters: number;
  gallery: number;
}

async function applyChunked<T>(
  rows: T[],
  size: number,
  fn: (tx: Tx, row: T) => Promise<boolean>,
): Promise<number> {
  let applied = 0;
  for (const part of chunk(rows, size)) {
    await prisma.$transaction(async (tx) => {
      for (const row of part) {
        if (await fn(tx, row)) applied += 1;
      }
    });
  }
  return applied;
}

export async function applyPush(userId: string, push: SyncPush, now: Date): Promise<AppliedCounts> {
  const counts: AppliedCounts = {
    workspaces: await applyChunked(push.workspaces, 100, (tx, r) => upsertWorkspace(tx, userId, r, now)),
    projects: await applyChunked(push.projects, 100, (tx, r) => upsertProject(tx, userId, r, now)),
    tasks: await applyChunked(push.tasks, 100, (tx, r) => upsertTask(tx, userId, r, now)),
    focusSessions: 0,
    settings: 0,
    characters: await applyChunked(push.characters, 100, (tx, r) => upsertCharacter(tx, userId, r, now)),
    gallery: await applyChunked(push.gallery, 100, (tx, r) => upsertGallery(tx, userId, r, now)),
  };

  // FocusSession 内容不可变，批量插入 + 跳过已存在行即可
  for (const part of chunk(push.focusSessions, 500)) {
    const result = await prisma.focusSession.createMany({
      data: part.map((row) => ({
        userId,
        id: row.id,
        workspaceId: row.workspaceId,
        taskId: row.taskId,
        characterId: row.characterId,
        taskText: row.taskText,
        focusMinutes: row.focusMinutes,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
        status: row.status as SessionStatus,
        updatedAt: new Date(row.updatedAt),
        syncedAt: now,
      })),
      skipDuplicates: true,
    });
    counts.focusSessions += result.count;
  }

  if (push.settings) {
    const applied = await prisma.$transaction((tx) => upsertSettings(tx, userId, push.settings!, now));
    counts.settings = applied ? 1 : 0;
  }
  return counts;
}

// ---- 拉取（客户端形状映射） ----

export interface PullWindow {
  since: Date;
  before: Date;
}

type WorkspaceRow = Prisma.WorkspaceGetPayload<object>;
type ProjectRow = Prisma.ProjectGetPayload<object>;
type TaskRow = Prisma.TaskGetPayload<object>;
type SessionRow = Prisma.FocusSessionGetPayload<object>;
type SettingsRow = Prisma.UserSettingsGetPayload<object>;
type CharacterRow = Prisma.CharacterProgressGetPayload<object>;
type GalleryRow = Prisma.GalleryEntryGetPayload<object>;

function toClientWorkspace(r: WorkspaceRow) {
  return {
    id: r.id,
    name: r.name,
    ownerId: r.userId,
    updatedAt: r.updatedAt.getTime(),
    ...(r.deletedAt ? { deleted: true as const } : {}),
  };
}

function toClientProject(r: ProjectRow) {
  return {
    id: r.id,
    workspaceId: r.workspaceId,
    name: r.name,
    color: r.color,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt.getTime(),
    ...(r.deletedAt ? { deleted: true as const } : {}),
  };
}

function toClientTask(r: TaskRow) {
  return {
    id: r.id,
    workspaceId: r.workspaceId,
    projectId: r.projectId,
    title: r.title,
    description: r.description,
    status: r.status,
    priority: r.priority,
    estimatedPomodoros: r.estimatedPomodoros,
    completedPomodoros: r.completedPomodoros,
    createdAt: r.createdAt,
    completedAt: r.completedAt,
    updatedAt: r.updatedAt.getTime(),
    ...(r.deletedAt ? { deleted: true as const } : {}),
  };
}

function toClientSession(r: SessionRow) {
  return {
    id: r.id,
    workspaceId: r.workspaceId,
    userId: r.userId,
    taskId: r.taskId,
    characterId: r.characterId,
    taskText: r.taskText,
    focusMinutes: r.focusMinutes,
    startedAt: r.startedAt,
    completedAt: r.completedAt,
    status: r.status,
    updatedAt: r.updatedAt.getTime(),
  };
}

function toClientSettings(r: SettingsRow) {
  return {
    defaultFocusMinutes: r.defaultFocusMinutes,
    breakMinutes: r.breakMinutes,
    musicId: r.musicId,
    voiceVolume: r.voiceVolume,
    musicVolume: r.musicVolume,
    muted: r.muted,
    currentCharacterId: r.currentCharacterId,
    currentWorkspaceId: r.currentWorkspaceId,
    updatedAt: r.updatedAt.getTime(),
  };
}

function toClientCharacter(r: CharacterRow) {
  return {
    characterId: r.characterId,
    completedPomodoros: r.completedPomodoros,
    storyProgress: r.storyProgress,
    unlockedEpisodeIds: Array.isArray(r.unlockedEpisodeIds) ? (r.unlockedEpisodeIds as string[]) : [],
    updatedAt: r.updatedAt.getTime(),
  };
}

function toClientGallery(r: GalleryRow) {
  return {
    episodeId: r.episodeId,
    characterId: r.characterId,
    characterName: r.characterName,
    title: r.title,
    unlockText: r.unlockText,
    unlockedAt: r.unlockedAt,
    taskText: r.taskText,
    updatedAt: r.updatedAt.getTime(),
  };
}

export async function collectPull(userId: string, w: PullWindow) {
  const syncedAt = { gte: w.since, lt: w.before };
  const [workspaces, projects, tasks, focusSessions, settings, characters, gallery] = await Promise.all([
    prisma.workspace.findMany({ where: { userId, syncedAt } }),
    prisma.project.findMany({ where: { userId, syncedAt } }),
    prisma.task.findMany({ where: { userId, syncedAt } }),
    prisma.focusSession.findMany({ where: { userId, syncedAt } }),
    prisma.userSettings.findFirst({ where: { userId, syncedAt } }),
    prisma.characterProgress.findMany({ where: { userId, syncedAt } }),
    prisma.galleryEntry.findMany({ where: { userId, syncedAt } }),
  ]);
  return {
    workspaces: workspaces.map(toClientWorkspace),
    projects: projects.map(toClientProject),
    tasks: tasks.map(toClientTask),
    focusSessions: focusSessions.map(toClientSession),
    settings: settings ? toClientSettings(settings) : null,
    characters: characters.map(toClientCharacter),
    gallery: gallery.map(toClientGallery),
  };
}

// ---- 同步入口（推 + 拉一次往返） ----

export async function runSync(userId: string, input: SyncRequest) {
  const now = new Date();
  const applied = await applyPush(userId, input.push, now);
  // 拉取窗口 [lastSyncedAt, now)：闭区间起点保证同毫秒写入不被跳过，
  // 开区间终点排除本次刚推送的行；自身行至多在下一轮回显一次（合并幂等）。
  const pull = await collectPull(userId, { since: new Date(input.lastSyncedAt), before: now });
  return { serverTime: now.getTime(), applied, pull };
}

// ---- REST 查询（列表默认过滤墓碑） ----

export async function listWorkspaces(userId: string) {
  const rows = await prisma.workspace.findMany({ where: { userId, deletedAt: null }, orderBy: { updatedAt: "desc" } });
  return rows.map(toClientWorkspace);
}

export async function listProjects(userId: string) {
  const rows = await prisma.project.findMany({ where: { userId, deletedAt: null }, orderBy: { updatedAt: "desc" } });
  return rows.map(toClientProject);
}

export async function listTasks(userId: string) {
  const rows = await prisma.task.findMany({ where: { userId, deletedAt: null }, orderBy: { updatedAt: "desc" } });
  return rows.map(toClientTask);
}

export async function getTask(userId: string, id: string) {
  const row = await prisma.task.findUnique({ where: { userId_id: { userId, id } } });
  return row && !row.deletedAt ? toClientTask(row) : null;
}

export async function listSessions(userId: string) {
  const rows = await prisma.focusSession.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  return rows.map(toClientSession);
}

export async function getSettings(userId: string) {
  const row = await prisma.userSettings.findUnique({ where: { userId } });
  return row ? toClientSettings(row) : null;
}

export async function listCharacters(userId: string) {
  const rows = await prisma.characterProgress.findMany({ where: { userId } });
  return rows.map(toClientCharacter);
}

export async function listGallery(userId: string) {
  const rows = await prisma.galleryEntry.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  return rows.map(toClientGallery);
}
