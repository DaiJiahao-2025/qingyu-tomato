// ============================================================
// Application state — must match "fanqieqingyu:v1" localStorage shape
// ============================================================

export type TimerStatus =
  | "idle"
  | "focusing"
  | "paused"
  | "break"
  | "story"
  | "completed";

export interface Settings {
  defaultFocusMinutes: number;
  breakMinutes: number;
  musicId: string;
  voiceVolume: number;
  musicVolume: number;
  muted: boolean;
}

export interface TimerState {
  status: TimerStatus;
  taskText: string;
  focusMinutes: number;
  startTime: number | null;
  endTime: number | null;
  pausedAt: number | null;
  totalPausedMs: number;
  remainingAtPauseMs: number | null;
  episodeId: string | null;
  taskId?: string | null;
}

export interface CharacterProgress {
  completedPomodoros: number;
  storyProgress: number;
  unlockedEpisodeIds: string[];
}

export interface GalleryEntry {
  episodeId: string;
  characterId: string;
  characterName: string;
  title: string;
  unlockText: string;
  unlockedAt: string;
  taskText: string;
}

export interface TaskHistoryEntry {
  taskText: string;
  completedAt: string;
  focusMinutes: number;
}

export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedPomodoros: number;
  completedPomodoros: number;
  projectId: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface FocusSession {
  id: string;
  workspaceId: string;
  userId: string;
  taskId: string | null;
  characterId: string;
  taskText: string;
  focusMinutes: number;
  startedAt: string;
  completedAt: string;
  status: "completed" | "cancelled";
}

export interface TodayRecord {
  date: string;
  completed: number;
}

/** The complete persistent state saved to localStorage "fanqieqingyu:v1" */
export interface AppState {
  currentCharacterId: string;
  settings: Settings;
  timerState: TimerState;
  characters: Record<string, CharacterProgress>;
  gallery: GalleryEntry[];
  taskHistory: TaskHistoryEntry[];
  workspaces: Workspace[];
  currentWorkspaceId: string;
  projects: Project[];
  tasks: Task[];
  focusSessions: FocusSession[];
  today: TodayRecord;
}

// ============================================================
// Data model — stories.json + character catalog
// ============================================================

export interface BgmAsset {
  bgmId: string;
  name: string;
  src: string;
}

export interface VoiceAsset {
  voiceId: string;
  src: string;
}

export interface Assets {
  backgrounds: { backgroundId: string; name: string; src: string }[];
  sprites: { spriteId: string; characterId: string; name: string; src: string }[];
  bgm: BgmAsset[];
  voices: VoiceAsset[];
}

export interface StoryCharacterDef {
  characterId: string;
  name: string;
  description: string;
}

export interface EpisodeVisual {
  startBackgroundId: string;
  startSpriteId: string;
  endBackgroundId: string;
  endSpriteId: string;
  unlockBackgroundId: string;
  unlockSpriteId: string;
}

export interface EpisodeAudioRef {
  startVoiceId: string;
  endVoiceId: string;
  bgmId: string;
}

export interface EpisodeDef {
  episodeId: string;
  characterId: string;
  requiredPomodoros: number;
  title: string;
  visual: EpisodeVisual;
  audio: EpisodeAudioRef;
  startLine: string;
  endLine: string;
  unlockText: string;
}

/** EpisodeDef after voice ID → file path resolution */
export interface EpisodeHydrated extends EpisodeDef {
  startVoice: string | null;
  endVoice: string | null;
}

export interface StoryData {
  version: string;
  storyId: string;
  storyName: string;
  characters: StoryCharacterDef[];
  assets: Assets;
  episodes: EpisodeDef[];
}

// ============================================================
// Character catalog (in-code, not from stories.json)
// ============================================================

export type CharacterRoleType = "senpai" | "classmate";

export interface CharacterDef {
  characterId: string;
  characterName: string;
  roleType: CharacterRoleType;
  style: string;
  portrait: string;
  galleryPortrait?: string;
  isAvailable: boolean;
  galleryStatus: string;
  description: string;
  voiceSampleEpisodeId: string | null;
  voiceSampleSrc?: string;
  voiceSampleLine?: string;
}

// ============================================================
// Music catalog
// ============================================================

export type MusicTone = "rain" | "cafe" | "fire";

export interface MusicTrack {
  id: string;
  name: string;
  tone: MusicTone;
  src: string;
}

// ============================================================
// View / navigation
// ============================================================

export type ViewName = "home" | "tasks" | "dashboard" | "gallery" | "settings";
export type GalleryMode = "chooser" | "detail";

// ============================================================
// Timer helpers
// ============================================================

export type TimerStartPayload = {
  taskText: string;
  focusMinutes: number;
  taskId?: string | null;
};
