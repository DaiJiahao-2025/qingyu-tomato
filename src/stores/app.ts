import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  playVoice,
  speakLine,
  startMusic,
  stopMusic,
  updateMusicVolume,
} from "@/composables/useAudio";
import type {
  AppState,
  Settings,
  TimerState,
  TimerStatus,
  EpisodeDef,
  EpisodeHydrated,
  CharacterDef,
  MusicTrack,
  ViewName,
  GalleryMode,
  TimerStartPayload,
  CharacterProgress,
} from "@/types";
import {
  SESSION_TIMER_KEY,
  clearAppState,
  defaultTimerState,
  hasActiveTimerSession,
  loadAppState,
  saveAppState,
} from "@/services/persistence";
import { preloadAudioMetadata, preloadImage, scheduleIdlePreload } from "@/composables/usePreload";

// ============================================================
// Constants
// ============================================================

const musicCatalog: MusicTrack[] = [
  { id: "rain_001", name: "Chill", tone: "rain", src: "/audio/music/DeepChill.mp3" },
  { id: "cafe_001", name: "雨天", tone: "cafe", src: "/audio/music/Rain.mp3" },
  { id: "fire_001", name: "森林", tone: "fire", src: "/audio/music/Forest.mp3" },
];

const charactersDef: CharacterDef[] = [
  {
    characterId: "suisui_001",
    characterName: "岁岁",
    roleType: "senpai",
    style: "校园陪伴 / 自习同桌",
    portrait: "/images/characters/suisui/岁岁.webp",
    galleryPortrait: "/images/characters/suisui/suisui_display.webp",
    isAvailable: true,
    galleryStatus: "当前开放",
    description: "温柔、可爱、聪明，陪你完成自习约定。",
    voiceSampleEpisodeId: "suisui_ep_001",
  },
  {
    characterId: "yaya_001",
    characterName: "娅娅",
    roleType: "classmate",
    style: "新角色 / 待开放剧情",
    portrait: "/images/characters/yaya/娅娅.webp",
    isAvailable: true,
    galleryStatus: "新角色",
    description: "新加入的角色，先在画廊露面；剧情和语音会在后续补上。",
    voiceSampleEpisodeId: null,
    voiceSampleSrc: "/audio/voice/yaya/start-001.wav",
    voiceSampleLine: "娅娅在这里，陪你一起开始今天的专注。",
  },
];

const STATUS_LABELS: Record<TimerStatus, string> = {
  idle: "等待开始",
  focusing: "专注中",
  paused: "已暂停",
  break: "休息中",
  completed: "已完成",
  story: "剧情中",
};

// ============================================================
// Utilities
// ============================================================

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalizePublicAssetPath(source: string | null): string | null {
  if (!source || /^https?:\/\//.test(source) || source.startsWith("./")) return source;
  if (source.startsWith("/")) return source;
  return source;
}

function createId(prefix: string): string {
  const random = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${random}`;
}

function getNavigationType(): string {
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return nav?.type || "navigate";
}

// ============================================================
// Store (setup syntax for full TypeScript inference)
// ============================================================

export const useAppStore = defineStore("app", () => {
  // ---- Persistent state (initialized from localStorage) ----
  const saved = loadAppState();

  const currentCharacterId = ref(saved.currentCharacterId);
  const settings = ref<Settings>(saved.settings);
  const timerState = ref<TimerState>(saved.timerState);
  const characters = ref<Record<string, CharacterProgress>>(saved.characters);
  const gallery = ref(saved.gallery);
  const taskHistory = ref(saved.taskHistory);
  const workspaces = ref(saved.workspaces);
  const currentWorkspaceId = ref(saved.currentWorkspaceId);
  const projects = ref(saved.projects);
  const tasks = ref(saved.tasks);
  const focusSessions = ref(saved.focusSessions);
  const today = ref(saved.today);

  // ---- Runtime (non-persisted) state ----
  const episodes = ref<EpisodeHydrated[]>([]);
  const activeView = ref<ViewName>("home");
  const galleryMode = ref<GalleryMode>("chooser");
  const showStartModal = ref(false);
  const showUnlockRibbon = ref(false);
  const unlockedTitle = ref("");
  const toastMessage = ref("");
  const toastVisible = ref(false);
  const currentLineOverride = ref<string | null>(null);
  const startTaskId = ref<string | null>(null);
  const tick = ref(0);  // incremented every second to force reactive time updates

  let toastTimer: ReturnType<typeof setTimeout> | null = null;
  let unlockTimer: ReturnType<typeof setTimeout> | null = null;

  // ---- Getters ----
  const remainingMs = computed(() => {
    void tick.value;  // dependency: forces re-evaluation on each tick
    const t = timerState.value;
    if (t.status === "paused") return Math.max(0, t.remainingAtPauseMs ?? 0);
    if (["focusing", "break"].includes(t.status)) return Math.max(0, (t.endTime ?? 0) - Date.now());
    if (["story", "completed"].includes(t.status)) return 0;
    return (t.focusMinutes || settings.value.defaultFocusMinutes) * 60 * 1000;
  });

  const statusLabel = computed(() => STATUS_LABELS[timerState.value.status] || "等待开始");

  const timeDisplay = computed(() => formatTime(remainingMs.value));

  const progressPct = computed(() => {
    const t = timerState.value;
    const initialMs =
      t.status === "break"
        ? settings.value.breakMinutes * 60 * 1000
        : Math.max(1, (t.focusMinutes || settings.value.defaultFocusMinutes) * 60 * 1000);
    if (t.status === "completed") return 100;
    if (["focusing", "paused", "break"].includes(t.status))
      return Math.min(100, Math.max(0, ((initialMs - remainingMs.value) / initialMs) * 100));
    return 0;
  });

  const isTimerActive = computed(() =>
    ["focusing", "paused", "break", "story", "completed"].includes(timerState.value.status)
  );

  const currentCharacter = computed(() =>
    charactersDef.find((c) => c.characterId === currentCharacterId.value) || charactersDef[0]
  );

  const currentEpisodes = computed(() =>
    episodes.value.filter((ep) => ep.characterId === currentCharacterId.value)
  );

  function getProgressForCharacter(characterId: string): CharacterProgress {
    if (!characters.value[characterId]) {
      characters.value[characterId] = { completedPomodoros: 0, storyProgress: 0, unlockedEpisodeIds: [] };
    }
    return characters.value[characterId];
  }

  const characterProgress = computed(() => getProgressForCharacter(currentCharacterId.value));

  const nextEpisode = computed(() => {
    const progress = characterProgress.value;
    return currentEpisodes.value.find((ep) => ep.requiredPomodoros === progress.storyProgress + 1);
  });

  const breakStory = computed(() => {
    const t = timerState.value;
    if (t.status !== "break" || !t.episodeId) return null;
    const gi = gallery.value.find((g) => g.episodeId === t.episodeId);
    if (gi?.unlockText) return { title: gi.title, unlockText: gi.unlockText };
    const ep = episodes.value.find((e) => e.episodeId === t.episodeId);
    if (!ep?.unlockText) return null;
    return { title: ep.title, unlockText: ep.unlockText };
  });

  const currentLine = computed(() => {
    if (currentLineOverride.value) return currentLineOverride.value;
    const t = timerState.value;
    const episode = episodes.value.find((ep) => ep.episodeId === t.episodeId) || nextEpisode.value;
    if (t.status === "focusing") return episode?.startLine || "我在这里，陪你完成这一轮。";
    if (t.status === "paused") return "暂停一下也没关系。回来时，我们从这里继续。";
    if (t.status === "break") return episode?.endLine || "先休息一下，眼睛也需要被照顾。";
    return nextEpisode.value?.startLine || "你已经完成了当前的 v1 剧情，新的故事以后再来。";
  });

  const characterCardData = computed(() => {
    const selectedId = currentCharacterId.value;
    return charactersDef.map((ch) => {
      const progress = getProgressForCharacter(ch.characterId);
      const charEps = episodes.value.filter((ep) => ep.characterId === ch.characterId);
      const total = charEps.length;
      const unlocked = Math.min(progress.storyProgress, total);
      const pct = total ? Math.min(100, (unlocked / total) * 100) : 0;
      return {
        ...ch,
        total,
        unlocked,
        progressPct: pct,
        progressLabel: total ? `${unlocked} / ${total} 段回忆` : "剧情准备中",
        isSelected: ch.characterId === selectedId,
      };
    });
  });

  const galleryCardData = computed(() => {
    const eps = episodes.value.filter((ep) => ep.characterId === currentCharacterId.value);
    const byEpisode = new Map(gallery.value.map((item) => [item.episodeId, item]));
    return eps.map((episode, index) => ({
      episode,
      index,
      item: byEpisode.get(episode.episodeId) || null,
    }));
  });

  const galleryKicker = computed(() => {
    const ch = currentCharacter.value;
    const progress = characterProgress.value;
    const count = currentEpisodes.value.length;
    return count ? `${Math.min(progress.storyProgress, count)} / ${count} 段回忆` : "角色剧情准备中";
  });

  const galleryCharacterName = computed(() => `${currentCharacter.value.characterName}的画廊`);

  function getVoiceEpisode(): EpisodeHydrated | null {
    const ch = currentCharacter.value;
    const sample = ch.voiceSampleEpisodeId ? episodes.value.find((ep) => ep.episodeId === ch.voiceSampleEpisodeId) : null;
    if (sample?.startVoice || sample?.endVoice) return sample;
    if (ch.voiceSampleSrc) {
      return {
        episodeId: "yaya_sample",
        characterId: ch.characterId,
        requiredPomodoros: 0,
        title: "语音预览",
        visual: {} as EpisodeHydrated["visual"],
        audio: {} as EpisodeHydrated["audio"],
        startLine: ch.voiceSampleLine || `${ch.characterName}在这里。`,
        endLine: "",
        unlockText: "",
        startVoice: ch.voiceSampleSrc ?? null,
        endVoice: null,
      };
    }
    return currentEpisodes.value.find((ep) => ep.startVoice || ep.endVoice) || null;
  }

  const voicePreviewReady = computed(() => !!getVoiceEpisode());

  const timerButtonsVisible = computed(() => {
    const s = timerState.value.status;
    return {
      pauseResume: ["focusing", "paused"].includes(s),
      exit: ["focusing", "paused"].includes(s),
      skipBreak: s === "break",
      continueNext: s === "completed",
      finishSession: s === "completed",
      focusStart: s === "idle",
    };
  });

  const pauseResumeLabel = computed(() => (timerState.value.status === "paused" ? "继续" : "暂停"));

  // ---- Actions ----

  function persist() {
    const snapshot: AppState = {
      currentCharacterId: currentCharacterId.value,
      settings: { ...settings.value },
      timerState: { ...timerState.value },
      characters: JSON.parse(JSON.stringify(characters.value)),
      gallery: gallery.value,
      taskHistory: taskHistory.value,
      workspaces: workspaces.value,
      currentWorkspaceId: currentWorkspaceId.value,
      projects: projects.value,
      tasks: tasks.value,
      focusSessions: focusSessions.value,
      today: { ...today.value },
    };
    saveAppState(snapshot);
  }

  function hydrateFromStorage() {
    const s = loadAppState();
    currentCharacterId.value = s.currentCharacterId;
    settings.value = s.settings;
    timerState.value = s.timerState;
    characters.value = s.characters;
    gallery.value = s.gallery;
    taskHistory.value = s.taskHistory;
    workspaces.value = s.workspaces;
    currentWorkspaceId.value = s.currentWorkspaceId;
    projects.value = s.projects;
    tasks.value = s.tasks;
    focusSessions.value = s.focusSessions;
    today.value = s.today;
  }

  function resetTodayIfNeeded() {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (today.value.date !== todayStr) {
      today.value = { date: todayStr, completed: 0 };
      persist();
    }
  }

  function restoreActiveTimerIfNeeded() {
    const activeStatuses: TimerStatus[] = ["focusing", "paused", "break"];
    if (!activeStatuses.includes(timerState.value.status)) return;
    if (hasActiveTimerSession() || getNavigationType() === "reload") {
      sessionStorage.setItem(SESSION_TIMER_KEY, "1");
      return;
    }
    timerState.value = defaultTimerState(settings.value.defaultFocusMinutes);
    persist();
  }

  async function loadStoryEpisodes() {
    const response = await fetch("/data/stories.json");
    if (!response.ok) throw new Error(`Failed to load story data: ${response.status}`);
    const storyData = await response.json();
    if (!Array.isArray(storyData.episodes)) throw new Error("Story data must contain an episodes array.");
    const voices = storyData.assets?.voices || [];
    const voiceSourceById = new Map<string, string | null>(
      voices.map((v: { voiceId: string; src: string }) => [v.voiceId, normalizePublicAssetPath(v.src)])
    );
    episodes.value = storyData.episodes.map((ep: EpisodeDef): EpisodeHydrated => ({
      ...ep,
      startVoice: voiceSourceById.get(ep.audio?.startVoiceId) ?? null,
      endVoice: voiceSourceById.get(ep.audio?.endVoiceId) ?? null,
    }));
  }

  async function init() {
    hydrateFromStorage();
    resetTodayIfNeeded();
    restoreActiveTimerIfNeeded();
    persist();
    try {
      await loadStoryEpisodes();
    } catch (error) {
      console.error(error);
      toast("剧情文件加载失败，请通过本地服务预览页面。");
    }
  }

  function navigateTo(view: ViewName) {
    activeView.value = view;
  }

  function toast(message: string) {
    toastMessage.value = message;
    toastVisible.value = true;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastVisible.value = false;
    }, 2600);
  }

  // ---- Timer state machine ----

  function startTimer({ taskText, focusMinutes, taskId = null }: TimerStartPayload) {
    const epList = currentEpisodes.value;
    const episode = nextEpisode.value || epList[epList.length - 1];
    const now = Date.now();
    timerState.value = {
      status: "focusing",
      taskText,
      focusMinutes,
      startTime: now,
      endTime: now + focusMinutes * 60 * 1000,
      pausedAt: null,
      totalPausedMs: 0,
      remainingAtPauseMs: null,
      episodeId: episode?.episodeId || null,
      taskId,
    };
    sessionStorage.setItem(SESSION_TIMER_KEY, "1");
    currentLineOverride.value = null;
    showStartModal.value = false;
    navigateTo("home");
    persist();

    // Audio: play start voice + start background music
    const startLine = episode?.startLine || "我在这里，陪你开始这一轮。";
    setCurrentLine(startLine);
    playVoice(
      episode?.startVoice ?? null,
      settings.value.voiceVolume,
      settings.value.muted,
      () => speakLine(startLine, settings.value.voiceVolume)
    );
    startMusic(settings.value.musicId, settings.value.musicVolume, settings.value.muted, musicCatalog);
    const nextVoice = currentEpisodes.value.find(
      (item) => item.requiredPomodoros === characterProgress.value.storyProgress + 2,
    )?.startVoice;
    scheduleIdlePreload(() => preloadAudioMetadata(nextVoice));
  }

  function togglePause() {
    const t = timerState.value;
    if (t.status === "focusing") {
      t.status = "paused";
      t.pausedAt = Date.now();
      t.remainingAtPauseMs = Math.max(0, (t.endTime ?? 0) - Date.now());
      stopMusic();
      toast("已暂停。");
    } else if (t.status === "paused") {
      const now = Date.now();
      t.status = "focusing";
      t.totalPausedMs += now - (t.pausedAt ?? now);
      t.endTime = now + (t.remainingAtPauseMs ?? 0);
      t.pausedAt = null;
      startMusic(settings.value.musicId, settings.value.musicVolume, settings.value.muted, musicCatalog);
      toast("继续专注。");
    }
    persist();
  }

  function exitTimer() {
    if (!["focusing", "paused"].includes(timerState.value.status)) return;
    timerState.value = defaultTimerState(settings.value.defaultFocusMinutes);
    sessionStorage.removeItem(SESSION_TIMER_KEY);
    currentLineOverride.value = null;
    stopMusic();
    persist();
    toast("本轮未完成计时已清空。");
  }

  function skipBreak() {
    if (timerState.value.status !== "break") return;
    timerState.value = {
      ...defaultTimerState(),
      status: "completed",
      taskText: timerState.value.taskText,
      focusMinutes: timerState.value.focusMinutes,
      startTime: Date.now(),
      endTime: Date.now(),
      episodeId: timerState.value.episodeId,
      taskId: timerState.value.taskId ?? null,
    };
    sessionStorage.removeItem(SESSION_TIMER_KEY);
    currentLineOverride.value = null;
    persist();
    toast("休息已结束，可以选择继续下一轮或退出。");
  }

  function continueNext() {
    if (timerState.value.status !== "completed") return;
    startTimer({
      taskText: timerState.value.taskText || "",
      focusMinutes: timerState.value.focusMinutes || settings.value.defaultFocusMinutes,
      taskId: timerState.value.taskId ?? null,
    });
  }

  function finishSession() {
    if (timerState.value.status !== "completed") return;
    timerState.value = defaultTimerState(settings.value.defaultFocusMinutes);
    sessionStorage.removeItem(SESSION_TIMER_KEY);
    stopMusic();
    persist();
    currentLineOverride.value = null;
    navigateTo("home");
  }

  function completePomodoro() {
    const t = timerState.value;
    if (t.status !== "focusing") return;
    const progress = getProgressForCharacter(currentCharacterId.value);
    const episode = episodes.value.find((ep) => ep.episodeId === t.episodeId) || nextEpisode.value;
    const now = Date.now();

    progress.completedPomodoros += 1;
    progress.storyProgress += 1;
    today.value.completed += 1;

    focusSessions.value.unshift({
      id: createId("focus"),
      workspaceId: currentWorkspaceId.value,
      userId: "local_user",
      taskId: t.taskId ?? null,
      characterId: currentCharacterId.value,
      taskText: t.taskText,
      focusMinutes: t.focusMinutes,
      startedAt: new Date(t.startTime ?? now).toISOString(),
      completedAt: new Date(now).toISOString(),
      status: "completed",
    });

    if (t.taskId) {
      const task = tasks.value.find((item) => item.id === t.taskId);
      if (task) {
        task.completedPomodoros += 1;
        task.status = task.completedPomodoros >= task.estimatedPomodoros ? "done" : "doing";
        task.completedAt = task.status === "done" ? new Date(now).toISOString() : null;
      }
    }

    if (episode && !progress.unlockedEpisodeIds.includes(episode.episodeId)) {
      progress.unlockedEpisodeIds.push(episode.episodeId);
      gallery.value.unshift({
        episodeId: episode.episodeId,
        characterId: episode.characterId,
        characterName: "岁岁",
        title: episode.title,
        unlockText: episode.unlockText,
        unlockedAt: new Date(now).toISOString(),
        taskText: t.taskText,
      });
    }

    if (t.taskText) {
      taskHistory.value.unshift({
        taskText: t.taskText,
        completedAt: new Date(now).toISOString(),
        focusMinutes: t.focusMinutes,
      });
      taskHistory.value = taskHistory.value.slice(0, 10);
    }

    timerState.value = {
      ...defaultTimerState(),
      status: "story",
      taskText: t.taskText,
      focusMinutes: t.focusMinutes,
      startTime: now,
      endTime: now,
      episodeId: episode?.episodeId || null,
      taskId: t.taskId ?? null,
    };

    sessionStorage.setItem(SESSION_TIMER_KEY, "1");
    currentLineOverride.value = episode?.endLine || "这一轮完成了，先休息一下。";
    persist();

    // Play end voice + stop music
    const endLine = episode?.endLine || "这一轮完成了，先休息一下。";
    setCurrentLine(endLine);
    stopMusic();
    playVoice(
      episode?.endVoice ?? null,
      settings.value.voiceVolume,
      settings.value.muted,
      () => speakLine(endLine, settings.value.voiceVolume)
    );

    if (episode) {
      unlockedTitle.value = episode.title;
      showUnlockRibbon.value = true;
      if (unlockTimer) clearTimeout(unlockTimer);
      unlockTimer = setTimeout(() => {
        showUnlockRibbon.value = false;
      }, 7000);
    }

    startBreakAfterStory();
  }

  function finishBreak() {
    if (timerState.value.status !== "break") return;
    timerState.value = {
      ...defaultTimerState(),
      status: "completed",
      taskText: timerState.value.taskText,
      focusMinutes: timerState.value.focusMinutes,
      startTime: Date.now(),
      endTime: Date.now(),
      episodeId: timerState.value.episodeId,
      taskId: timerState.value.taskId ?? null,
    };
    sessionStorage.removeItem(SESSION_TIMER_KEY);
    currentLineOverride.value = null;
    persist();
    toast("休息结束，可以选择继续下一轮或退出。");
  }

  function startBreakAfterStory() {
    const now = Date.now();
    timerState.value = {
      ...defaultTimerState(),
      status: "break",
      taskText: timerState.value.taskText,
      focusMinutes: timerState.value.focusMinutes,
      startTime: now,
      endTime: now + settings.value.breakMinutes * 60 * 1000,
      episodeId: timerState.value.episodeId,
      taskId: timerState.value.taskId ?? null,
    };
    sessionStorage.setItem(SESSION_TIMER_KEY, "1");
    persist();
  }

  function openStartModal(taskId: string | null = null) {
    showUnlockRibbon.value = false;
    startTaskId.value = taskId;
    showStartModal.value = true;
  }

  function closeStartModal() {
    startTaskId.value = null;
    showStartModal.value = false;
  }

  // ---- Settings ----

  function updateSettings(patch: Partial<Settings>) {
    Object.assign(settings.value, patch);
    persist();
  }

  function clearAllData() {
    clearAppState();
    hydrateFromStorage();
    toast("本地数据已清除。");
  }

  // ---- Gallery navigation ----

  function selectCharacterGallery(characterId: string) {
    const exists = charactersDef.some((c) => c.characterId === characterId && c.isAvailable);
    if (!exists) return;
    currentCharacterId.value = characterId;
    galleryMode.value = "detail";
    persist();
    navigateTo("gallery");
    const selected = charactersDef.find((character) => character.characterId === characterId);
    const firstVoice = episodes.value.find((episode) => episode.characterId === characterId)?.startVoice;
    scheduleIdlePreload(() => {
      preloadImage(selected?.galleryPortrait || selected?.portrait);
      preloadAudioMetadata(firstVoice);
    });
  }

  function showGalleryChooser() {
    galleryMode.value = "chooser";
  }

  function getPomodoroCharacterId(): string {
    const defIds = charactersDef.filter((c) => c.isAvailable).map((c) => c.characterId);
    if (defIds.includes(currentCharacterId.value)) return currentCharacterId.value;
    return defIds[0] || "suisui_001";
  }

  function doTick() {
    tick.value += 1;
  }

  // ---- Voice / line helpers (for audio composable to hook into) ----
  function setCurrentLine(line: string) {
    currentLineOverride.value = line;
  }

  function previewVoice() {
    const episode = getVoiceEpisode();
    const ch = currentCharacter.value;
    if (!episode) {
      toast(`${ch.characterName}的语音还在准备中。`);
      return null;
    }
    const line = episode.startLine || episode.endLine || `${ch.characterName}在这里。`;
    setCurrentLine(line);
    return { phase: "start" as const, episode, line };
  }

  function replayVoice(episodeId: string) {
    const episode = episodes.value.find((ep) => ep.episodeId === episodeId);
    if (!episode) return null;
    const line = episode.endLine || "这是你已经解锁的剧情。";
    setCurrentLine(line);
    return { phase: "replay" as const, episode, line };
  }

  return {
    // state
    currentCharacterId,
    settings,
    timerState,
    characters,
    gallery,
    taskHistory,
    workspaces,
    currentWorkspaceId,
    projects,
    tasks,
    focusSessions,
    today,
    episodes,
    musicCatalog,
    charactersDef,
    activeView,
    galleryMode,
    showStartModal,
    showUnlockRibbon,
    unlockedTitle,
    toastMessage,
    toastVisible,
    currentLineOverride,
    startTaskId,
    tick,
    // getters
    remainingMs,
    statusLabel,
    timeDisplay,
    progressPct,
    isTimerActive,
    currentCharacter,
    currentEpisodes,
    characterProgress,
    nextEpisode,
    breakStory,
    currentLine,
    characterCardData,
    galleryCardData,
    galleryKicker,
    galleryCharacterName,
    voicePreviewReady,
    timerButtonsVisible,
    pauseResumeLabel,
    // actions
    persist,
    hydrateFromStorage,
    resetTodayIfNeeded,
    restoreActiveTimerIfNeeded,
    loadStoryEpisodes,
    init,
    navigateTo,
    toast,
    startTimer,
    togglePause,
    exitTimer,
    skipBreak,
    continueNext,
    finishSession,
    completePomodoro,
    finishBreak,
    startBreakAfterStory,
    openStartModal,
    closeStartModal,
    updateSettings,
    clearAllData,
    selectCharacterGallery,
    showGalleryChooser,
    getPomodoroCharacterId,
    getProgressForCharacter,
    getVoiceEpisode,
    setCurrentLine,
    previewVoice,
    replayVoice,
    doTick,
  };
});
