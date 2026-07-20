import type { AppState, CharacterProgress, Settings, TimerState } from "@/types";

export const STORAGE_KEY = "fanqieqingyu:v1";
export const SESSION_TIMER_KEY = "fanqieqingyu:activeTimerSession";

export function defaultTimerState(focusMinutes = 25): TimerState {
  return {
    status: "idle",
    taskText: "",
    focusMinutes,
    startTime: null,
    endTime: null,
    pausedAt: null,
    totalPausedMs: 0,
    remainingAtPauseMs: null,
    episodeId: null,
    taskId: null,
  };
}

export function defaultSettings(): Settings {
  return {
    defaultFocusMinutes: 25,
    breakMinutes: 5,
    musicId: "rain_001",
    voiceVolume: 0.7,
    musicVolume: 0.25,
    muted: false,
  };
}

function defaultCharacterProgress(): Record<string, CharacterProgress> {
  return {
    suisui_001: { completedPomodoros: 0, storyProgress: 0, unlockedEpisodeIds: [] },
    yaya_001: { completedPomodoros: 0, storyProgress: 0, unlockedEpisodeIds: [] },
  };
}

export function defaultAppState(): AppState {
  return {
    currentCharacterId: "suisui_001",
    settings: defaultSettings(),
    timerState: defaultTimerState(),
    characters: defaultCharacterProgress(),
    gallery: [],
    taskHistory: [],
    workspaces: [{ id: "workspace_personal", name: "个人工作区", ownerId: "local_user" }],
    currentWorkspaceId: "workspace_personal",
    projects: [],
    tasks: [],
    focusSessions: [],
    today: { date: new Date().toISOString().slice(0, 10), completed: 0 },
  };
}

export function mergeAppState(base: AppState, saved: Partial<AppState>): AppState {
  const legacyHistory = Array.isArray(saved.taskHistory) ? saved.taskHistory : [];
  const migratedSessions = Array.isArray(saved.focusSessions)
    ? saved.focusSessions
    : legacyHistory.map((item, index) => ({
        id: `legacy_session_${index}_${item.completedAt}`,
        workspaceId: "workspace_personal",
        userId: "local_user",
        taskId: null,
        characterId: saved.currentCharacterId || base.currentCharacterId,
        taskText: item.taskText,
        focusMinutes: item.focusMinutes,
        startedAt: item.completedAt,
        completedAt: item.completedAt,
        status: "completed" as const,
      }));

  return {
    ...base,
    ...saved,
    settings: { ...base.settings, ...(saved.settings || {}) },
    timerState: { ...base.timerState, ...(saved.timerState || {}) },
    characters: { ...base.characters, ...(saved.characters || {}) },
    today: { ...base.today, ...(saved.today || {}) },
    gallery: Array.isArray(saved.gallery) ? saved.gallery : base.gallery,
    taskHistory: legacyHistory,
    workspaces: Array.isArray(saved.workspaces) && saved.workspaces.length ? saved.workspaces : base.workspaces,
    currentWorkspaceId: saved.currentWorkspaceId || base.currentWorkspaceId,
    projects: Array.isArray(saved.projects) ? saved.projects : base.projects,
    tasks: Array.isArray(saved.tasks) ? saved.tasks : base.tasks,
    focusSessions: migratedSessions,
  };
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? mergeAppState(defaultAppState(), JSON.parse(raw)) : defaultAppState();
  } catch {
    return defaultAppState();
  }
}

export function saveAppState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearAppState(): void {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(SESSION_TIMER_KEY);
}

export function hasActiveTimerSession(): boolean {
  return sessionStorage.getItem(SESSION_TIMER_KEY) === "1";
}
