export function mountPomodoroApp() {
"use strict";

const STORAGE_KEY = "fanqieqingyu:v1";
const SESSION_TIMER_KEY = "fanqieqingyu:activeTimerSession";
const STORY_DATA_URL = "./public/data/stories.json";

const musicCatalog = [
  { id: "rain_001", name: "雨天", tone: "rain", src: "./public/audio/music/DeepChill.mp3" },
  { id: "cafe_001", name: "咖啡馆", tone: "cafe", src: "./public/audio/music/cafe_001.mp3" },
  { id: "fire_001", name: "篝火", tone: "fire", src: "./public/audio/music/fire_001.mp3" },
];

const characters = [
  {
    characterId: "suisui_001",
    characterName: "\u5c81\u5c81",
    roleType: "senpai",
    style: "\u6821\u56ed\u966a\u4f34 / \u81ea\u4e60\u540c\u684c",
    portrait: "./public/images/characters/suisui/\u5c81\u5c81.webp",
    isAvailable: true,
    galleryStatus: "\u5f53\u524d\u5f00\u653e",
    description: "\u6e29\u67d4\u3001\u53ef\u7231\u3001\u806a\u660e\uff0c\u966a\u4f60\u5b8c\u6210\u81ea\u4e60\u7ea6\u5b9a\u3002",
    voiceSampleEpisodeId: "suisui_ep_001",
  },
  {
    characterId: "yaya_001",
    characterName: "\u5a05\u5a05",
    roleType: "classmate",
    style: "\u65b0\u89d2\u8272 / \u5f85\u5f00\u653e\u5267\u60c5",
    portrait: "./public/images/characters/yaya/\u5a05\u5a05.webp",
    isAvailable: true,
    galleryStatus: "\u65b0\u89d2\u8272",
    description: "\u65b0\u52a0\u5165\u7684\u89d2\u8272\uff0c\u5148\u5728\u753b\u5eca\u9732\u9762\uff1b\u5267\u60c5\u548c\u8bed\u97f3\u4f1a\u5728\u540e\u7eed\u8865\u4e0a\u3002",
    voiceSampleEpisodeId: null,
    voiceSampleSrc: "./public/audio/voice/yaya/start-001.wav",
    voiceSampleLine: "\u5a05\u5a05\u5728\u8fd9\u91cc\uff0c\u966a\u4f60\u4e00\u8d77\u5f00\u59cb\u4eca\u5929\u7684\u4e13\u6ce8\u3002",
  },
];

const defaultState = {
  currentCharacterId: "suisui_001",
  settings: {
    defaultFocusMinutes: 25,
    breakMinutes: 5,
    musicId: "rain_001",
    voiceVolume: 0.7,
    musicVolume: 0.25,
    muted: false,
  },
  timerState: {
    status: "idle",
    taskText: "",
    focusMinutes: 25,
    startTime: null,
    endTime: null,
    pausedAt: null,
    totalPausedMs: 0,
    remainingAtPauseMs: null,
    episodeId: null,
  },
  characters: {
    suisui_001: {
      completedPomodoros: 0,
      storyProgress: 0,
      unlockedEpisodeIds: [],
    },
    yaya_001: {
      completedPomodoros: 0,
      storyProgress: 0,
      unlockedEpisodeIds: [],
    },
  },
  gallery: [],
  taskHistory: [],
  today: {
    date: new Date().toISOString().slice(0, 10),
    completed: 0,
  },
};

let state = loadState();
let timerTick = null;
let audioEngine = null;
let musicAudio = null;
let voiceAudio = null;
let episodes = [];
let galleryMode = "chooser";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  navButtons: $$("[data-view-target]"),
  homeEmptyState: $("#homeEmptyState"),
  immersiveTimer: $("#immersiveTimer"),
  startModal: $("#startModal"),
  closeStartModal: $("#closeStartModal"),
  taskInput: $("#taskInput"),
  focusMinutesInput: $("#focusMinutesInput"),
  modalBreakMinutesInput: $("#modalBreakMinutesInput"),
  characterSelect: $("#characterSelect"),
  musicSelect: $("#musicSelect"),
  mutedToggle: $("#mutedToggle"),
  startButton: $("#startButton"),
  focusStartButton: $("#focusStartButton"),
  startError: $("#startError"),
  currentLine: $("#currentLine"),
  completedCount: $("#completedCount"),
  storyProgress: $("#storyProgress"),
  nextEpisodeTitle: $("#nextEpisodeTitle"),
  railTodayCount: $("#railTodayCount"),
  timeRemaining: $("#timeRemaining"),
  timerStateLabel: $("#timerStateLabel"),
  activeTask: $("#activeTask"),
  breakStoryPanel: $("#breakStoryPanel"),
  breakStoryTitle: $("#breakStoryTitle"),
  breakStoryText: $("#breakStoryText"),
  pauseResumeButton: $("#pauseResumeButton"),
  exitButton: $("#exitButton"),
  skipBreakButton: $("#skipBreakButton"),
  continueNextButton: $("#continueNextButton"),
  finishSessionButton: $("#finishSessionButton"),
  focusLine: $("#focusLine"),
  unlockRibbon: $("#unlockRibbon"),
  unlockedTitle: $("#unlockedTitle"),
  galleryGrid: $("#galleryGrid"),
  galleryChooser: $(".gallery-chooser"),
  galleryDetail: $("[data-gallery-detail]"),
  characterCardRow: $("#characterCardRow"),
  galleryBackButton: $("#galleryBackButton"),
  galleryCharacterKicker: $("#galleryCharacterKicker"),
  galleryCharacterName: $("#galleryCharacterName"),
  voicePreviewButton: $("#voicePreviewButton"),
  defaultFocusInput: $("#defaultFocusInput"),
  breakMinutesInput: $("#breakMinutesInput"),
  voiceVolumeInput: $("#voiceVolumeInput"),
  musicVolumeInput: $("#musicVolumeInput"),
  taskHistory: $("#taskHistory"),
  clearDataButton: $("#clearDataButton"),
  toast: $("#toast"),
  timerOrbit: $("#timerOrbit"),
  characterImages: $$("[data-character-image]"),
};

init().catch((error) => {
  console.error(error);
  elements.toast.textContent = "剧情文件加载失败，请通过本地服务预览页面。";
  elements.toast.classList.add("is-visible");
});

async function init() {
  episodes = await loadStoryEpisodes();
  resetTodayIfNeeded();
  restoreActiveTimerIfNeeded();
  populateMusic();
  renderCharacterImages();
  bindEvents();
  hydrateForm();
  render();
  startTicker();
}

async function loadStoryEpisodes() {
  const response = await fetch(STORY_DATA_URL);
  if (!response.ok) {
    throw new Error(`Failed to load story data: ${response.status}`);
  }

  const storyData = await response.json();
  if (!Array.isArray(storyData.episodes)) {
    throw new Error("Story data must contain an episodes array.");
  }

  return hydrateEpisodeVoiceSources(storyData);
}

function hydrateEpisodeVoiceSources(storyData) {
  const voices = storyData.assets?.voices || [];
  const voiceSourceById = new Map(
    voices.map((voice) => [voice.voiceId, normalizePublicAssetPath(voice.src)]),
  );

  return storyData.episodes.map((episode) => ({
    ...episode,
    startVoice: episode.startVoice || voiceSourceById.get(episode.audio?.startVoiceId) || null,
    endVoice: episode.endVoice || voiceSourceById.get(episode.audio?.endVoiceId) || null,
  }));
}

function normalizePublicAssetPath(source) {
  if (!source || /^https?:\/\//.test(source) || source.startsWith("./")) return source;
  if (source.startsWith("/")) return `./public${source}`;
  return source;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    return mergeState(structuredClone(defaultState), JSON.parse(raw));
  } catch {
    return structuredClone(defaultState);
  }
}

function mergeState(base, saved) {
  return {
    ...base,
    ...saved,
    settings: { ...base.settings, ...(saved.settings || {}) },
    timerState: { ...base.timerState, ...(saved.timerState || {}) },
    characters: { ...base.characters, ...(saved.characters || {}) },
    today: { ...base.today, ...(saved.today || {}) },
    gallery: Array.isArray(saved.gallery) ? saved.gallery : base.gallery,
    taskHistory: Array.isArray(saved.taskHistory) ? saved.taskHistory : base.taskHistory,
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetTodayIfNeeded() {
  const today = new Date().toISOString().slice(0, 10);
  if (state.today.date !== today) {
    state.today = { date: today, completed: 0 };
    saveState();
  }
}

function restoreActiveTimerIfNeeded() {
  const activeStatuses = ["focusing", "paused", "break"];
  if (!activeStatuses.includes(state.timerState.status)) return;
  if (hasTimerSession() || getNavigationType() === "reload") {
    sessionStorage.setItem(SESSION_TIMER_KEY, "1");
    return;
  }
  state.timerState = { ...defaultState.timerState, focusMinutes: state.settings.defaultFocusMinutes };
  saveState();
}

function hasTimerSession() {
  return sessionStorage.getItem(SESSION_TIMER_KEY) === "1";
}

function getNavigationType() {
  return performance.getEntriesByType("navigation")[0]?.type || "navigate";
}

function populateMusic() {
  elements.musicSelect.innerHTML = musicCatalog
    .map((music) => `<option value="${music.id}">${music.name}</option>`)
    .join("");
}

function renderCharacterImages() {
  const character = getCurrentCharacter();
  elements.characterImages.forEach((image) => {
    image.src = character.portrait;
    image.alt = `${character.characterName}立绘`;
    image.hidden = false;
    image.addEventListener(
      "error",
      () => {
        image.hidden = true;
      },
      { once: true },
    );
  });
}

function bindEvents() {
  elements.navButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      if (button.dataset.viewTarget === "gallery") {
        galleryMode = "chooser";
        renderGalleryShell();
      }
      showView(button.dataset.viewTarget);
    });
  });

  elements.focusStartButton.addEventListener("click", openStartModal);
  elements.closeStartModal.addEventListener("click", closeStartModal);
  elements.startModal.addEventListener("click", (event) => {
    if (event.target === elements.startModal) closeStartModal();
  });
  elements.startButton.addEventListener("click", () => requestStartFromForm());
  elements.pauseResumeButton.addEventListener("click", togglePause);
  elements.exitButton.addEventListener("click", exitCurrentTimer);
  elements.skipBreakButton.addEventListener("click", skipBreak);
  elements.continueNextButton.addEventListener("click", continueNextPomodoro);
  elements.finishSessionButton.addEventListener("click", finishCompletedSession);
  elements.characterCardRow.addEventListener("click", (event) => {
    const button = event.target.closest("[data-character-gallery]");
    if (button) selectCharacterGallery(button.dataset.characterGallery);
  });
  elements.characterCardRow.addEventListener("pointermove", updateCardPointer);
  elements.characterCardRow.addEventListener("pointerleave", resetCardPointer);
  elements.galleryBackButton.addEventListener("click", showGalleryChooser);
  elements.voicePreviewButton.addEventListener("click", previewCurrentCharacterVoice);

  elements.mutedToggle.addEventListener("change", () => {
    state.settings.muted = elements.mutedToggle.checked;
    if (state.settings.muted) stopMusic();
    saveState();
    render();
  });

  elements.musicSelect.addEventListener("change", () => {
    state.settings.musicId = elements.musicSelect.value;
    saveState();
    if (state.timerState.status === "focusing" && !state.settings.muted) startMusic();
  });

  elements.defaultFocusInput.addEventListener("change", () => {
    const value = Number(elements.defaultFocusInput.value);
    state.settings.defaultFocusMinutes = Math.max(25, value || 25);
    if (state.timerState.status === "idle") {
      state.timerState.focusMinutes = state.settings.defaultFocusMinutes;
      elements.focusMinutesInput.value = state.settings.defaultFocusMinutes;
    }
    saveState();
    render();
  });

  elements.breakMinutesInput.addEventListener("change", () => {
    state.settings.breakMinutes = Math.max(1, Number(elements.breakMinutesInput.value) || 5);
    saveState();
    render();
  });

  elements.voiceVolumeInput.addEventListener("input", () => {
    state.settings.voiceVolume = Number(elements.voiceVolumeInput.value);
    saveState();
  });

  elements.musicVolumeInput.addEventListener("input", () => {
    state.settings.musicVolume = Number(elements.musicVolumeInput.value);
    updateMusicVolume();
    saveState();
  });

  elements.clearDataButton.addEventListener("click", () => {
    if (!confirm("确认清除本地进度、画廊和设置吗？")) return;
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_TIMER_KEY);
    stopMusic();
    state = structuredClone(defaultState);
    hydrateForm();
    render();
    showView("home");
    toast("本地数据已清除。");
  });
}

function hydrateForm() {
  elements.focusMinutesInput.value = state.timerState.focusMinutes || state.settings.defaultFocusMinutes;
  elements.modalBreakMinutesInput.value = state.settings.breakMinutes;
  elements.characterSelect.value = getPomodoroCharacterId();
  elements.musicSelect.value = state.settings.musicId;
  elements.mutedToggle.checked = state.settings.muted;
  elements.defaultFocusInput.value = state.settings.defaultFocusMinutes;
  elements.breakMinutesInput.value = state.settings.breakMinutes;
  elements.voiceVolumeInput.value = state.settings.voiceVolume;
  elements.musicVolumeInput.value = state.settings.musicVolume;
}

function showView(viewName) {
  if (!viewName) return;
  $$(".view").forEach((view) => view.classList.toggle("is-visible", view.dataset.view === viewName));
  $$(".nav-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewTarget === viewName);
  });
}

function selectCharacterGallery(characterId) {
  if (!characters.some((character) => character.characterId === characterId && character.isAvailable)) return;
  state.currentCharacterId = characterId;
  galleryMode = "detail";
  saveState();
  renderCharacterImages();
  render();
  showView("gallery");
}

function showGalleryChooser() {
  galleryMode = "chooser";
  renderGalleryShell();
}

function openStartModal() {
  hydrateForm();
  elements.startError.textContent = "";
  elements.startModal.hidden = false;
  window.setTimeout(() => elements.taskInput.focus(), 0);
}

function closeStartModal() {
  elements.startModal.hidden = true;
}

function requestStartFromForm(forceFocusView = false) {
  elements.startError.textContent = "";
  const focusMinutes = Number(elements.focusMinutesInput.value || state.settings.defaultFocusMinutes);
  if (focusMinutes < 25) {
    elements.startError.textContent = "番茄时长不能少于 25 分钟。";
    toast("番茄时长不能少于 25 分钟。");
    return;
  }

  state.currentCharacterId = elements.characterSelect.value || getPomodoroCharacterId();
  state.settings.breakMinutes = Math.max(1, Number(elements.modalBreakMinutesInput.value) || state.settings.breakMinutes);
  elements.breakMinutesInput.value = state.settings.breakMinutes;
  saveState();

  const payload = {
    taskText: elements.taskInput.value.trim().slice(0, 15),
    focusMinutes,
  };

  startTimer(payload);
  if (forceFocusView) showView("home");
}

function startTimer({ taskText, focusMinutes }) {
  const episode = getNextEpisode() || getCurrentCharacterEpisodes().at(-1);
  const now = Date.now();
  state.timerState = {
    status: "focusing",
    taskText,
    focusMinutes,
    startTime: now,
    endTime: now + focusMinutes * 60 * 1000,
    pausedAt: null,
    totalPausedMs: 0,
    remainingAtPauseMs: null,
    episodeId: episode?.episodeId || null,
  };
  sessionStorage.setItem(SESSION_TIMER_KEY, "1");
  saveState();
  closeStartModal();
  showView("home");
  playLine(episode?.startLine || "我在这里，陪你开始这一轮。", "start", episode);
  startMusic();
  render();
}

function togglePause() {
  const timer = state.timerState;
  if (timer.status === "focusing") {
    timer.status = "paused";
    timer.pausedAt = Date.now();
    timer.remainingAtPauseMs = Math.max(0, timer.endTime - Date.now());
    stopMusic();
    toast("已暂停。");
  } else if (timer.status === "paused") {
    const now = Date.now();
    timer.status = "focusing";
    timer.totalPausedMs += now - timer.pausedAt;
    timer.endTime = now + timer.remainingAtPauseMs;
    timer.pausedAt = null;
    startMusic();
    toast("继续专注。");
  }
  saveState();
  render();
}

function exitCurrentTimer() {
  if (!["focusing", "paused"].includes(state.timerState.status)) return;
  state.timerState = { ...defaultState.timerState, focusMinutes: state.settings.defaultFocusMinutes };
  sessionStorage.removeItem(SESSION_TIMER_KEY);
  stopMusic();
  saveState();
  render();
  toast("本轮未完成计时已清空。");
}

function skipBreak() {
  if (state.timerState.status !== "break") return;
  state.timerState = {
    ...defaultState.timerState,
    status: "completed",
    taskText: state.timerState.taskText,
    focusMinutes: state.timerState.focusMinutes,
    startTime: Date.now(),
    endTime: Date.now(),
    episodeId: state.timerState.episodeId,
  };
  sessionStorage.removeItem(SESSION_TIMER_KEY);
  saveState();
  render();
  toast("休息已结束，可以选择继续下一轮或退出。");
}

function continueNextPomodoro() {
  if (state.timerState.status !== "completed") return;
  const payload = {
    taskText: state.timerState.taskText || "",
    focusMinutes: state.timerState.focusMinutes || state.settings.defaultFocusMinutes,
  };
  startTimer(payload);
}

function finishCompletedSession() {
  if (state.timerState.status !== "completed") return;
  state.timerState = { ...defaultState.timerState, focusMinutes: state.settings.defaultFocusMinutes };
  sessionStorage.removeItem(SESSION_TIMER_KEY);
  stopMusic();
  saveState();
  render();
  showView("home");
}

function completePomodoro() {
  const timer = state.timerState;
  if (timer.status !== "focusing") return;
  const progress = getCurrentProgress();
  const episode = getEpisode(timer.episodeId) || getNextEpisode();
  const now = Date.now();

  progress.completedPomodoros += 1;
  progress.storyProgress += 1;
  state.today.completed += 1;

  if (episode && !progress.unlockedEpisodeIds.includes(episode.episodeId)) {
    progress.unlockedEpisodeIds.push(episode.episodeId);
    state.gallery.unshift({
      episodeId: episode.episodeId,
      characterId: episode.characterId,
      characterName: "岁岁",
      title: episode.title,
      unlockText: episode.unlockText,
      unlockedAt: new Date(now).toISOString(),
      taskText: timer.taskText,
    });
  }

  if (timer.taskText) {
    state.taskHistory.unshift({
      taskText: timer.taskText,
      completedAt: new Date(now).toISOString(),
      focusMinutes: timer.focusMinutes,
    });
    state.taskHistory = state.taskHistory.slice(0, 10);
  }

  state.timerState = {
    ...defaultState.timerState,
    status: "story",
    taskText: timer.taskText,
    focusMinutes: timer.focusMinutes,
    startTime: now,
    endTime: now,
    episodeId: episode?.episodeId || null,
  };

  playLine(episode?.endLine || "这一轮完成了，先休息一下。", "end", episode);
  stopMusic();
  sessionStorage.setItem(SESSION_TIMER_KEY, "1");
  saveState();
  renderUnlock(episode);
  render();

  startBreakAfterStory();
}

function finishBreak() {
  if (state.timerState.status !== "break") return;
  state.timerState = {
    ...defaultState.timerState,
    status: "completed",
    taskText: state.timerState.taskText,
    focusMinutes: state.timerState.focusMinutes,
    startTime: Date.now(),
    endTime: Date.now(),
    episodeId: state.timerState.episodeId,
  };
  sessionStorage.removeItem(SESSION_TIMER_KEY);
  saveState();
  render();
  toast("休息结束，可以选择继续下一轮或退出。");
}

function startBreakAfterStory() {
  const now = Date.now();
  state.timerState = {
    ...defaultState.timerState,
    status: "break",
    taskText: state.timerState.taskText,
    focusMinutes: state.timerState.focusMinutes,
    startTime: now,
    endTime: now + state.settings.breakMinutes * 60 * 1000,
    episodeId: state.timerState.episodeId,
  };
  sessionStorage.setItem(SESSION_TIMER_KEY, "1");
  saveState();
  render();
}

function render() {
  const progress = getCurrentProgress();
  const nextEpisode = getNextEpisode();
  const episodeCount = getCurrentCharacterEpisodes().length;
  const timer = state.timerState;
  const remaining = getRemainingMs();
  const initialMs =
    timer.status === "break"
      ? state.settings.breakMinutes * 60 * 1000
      : Math.max(1, (timer.focusMinutes || state.settings.defaultFocusMinutes) * 60 * 1000);
  const progressPct =
    timer.status === "completed"
      ? 100
      : ["focusing", "paused", "break"].includes(timer.status)
        ? Math.min(100, Math.max(0, ((initialMs - remaining) / initialMs) * 100))
        : 0;

  const timerIsActive = ["focusing", "paused", "break", "story", "completed"].includes(timer.status);
  elements.homeEmptyState.hidden = timerIsActive;
  elements.immersiveTimer.hidden = !timerIsActive;
  if (elements.completedCount) elements.completedCount.textContent = progress.completedPomodoros;
  if (elements.storyProgress) {
    elements.storyProgress.textContent = `${Math.min(progress.storyProgress, episodeCount)} / ${episodeCount}`;
  }
  if (elements.nextEpisodeTitle) elements.nextEpisodeTitle.textContent = nextEpisode ? nextEpisode.title : "更多剧情准备中";
  elements.railTodayCount.textContent = state.today.completed;
  elements.currentLine.textContent = getCurrentLine();
  elements.focusLine.textContent = getCurrentLine();
  const breakStory = getCurrentBreakStory();
  elements.breakStoryPanel.hidden = !breakStory;
  if (breakStory) {
    elements.breakStoryTitle.textContent = breakStory.title;
    elements.breakStoryText.textContent = breakStory.unlockText;
  } else {
    elements.breakStoryTitle.textContent = "";
    elements.breakStoryText.textContent = "";
  }
  elements.timeRemaining.textContent = formatTime(remaining);
  elements.timerStateLabel.textContent = getStatusLabel(timer.status);
  elements.activeTask.textContent = timer.taskText || elements.taskInput.value.trim() || "还没有本轮任务";
  elements.pauseResumeButton.textContent = timer.status === "paused" ? "继续" : "暂停";
  elements.pauseResumeButton.hidden = !["focusing", "paused"].includes(timer.status);
  elements.exitButton.hidden = !["focusing", "paused"].includes(timer.status);
  elements.skipBreakButton.hidden = timer.status !== "break";
  elements.continueNextButton.hidden = timer.status !== "completed";
  elements.finishSessionButton.hidden = timer.status !== "completed";
  elements.focusStartButton.hidden = timer.status !== "idle";
  elements.timerOrbit.style.setProperty("--timer-progress", `${progressPct}%`);

  elements.mutedToggle.checked = state.settings.muted;
  elements.modalBreakMinutesInput.value = state.settings.breakMinutes;
  elements.characterSelect.value = getPomodoroCharacterId();
  elements.musicSelect.value = state.settings.musicId;
  elements.defaultFocusInput.value = state.settings.defaultFocusMinutes;
  elements.breakMinutesInput.value = state.settings.breakMinutes;
  elements.voiceVolumeInput.value = state.settings.voiceVolume;
  elements.musicVolumeInput.value = state.settings.musicVolume;

  renderGalleryShell();
  renderCharacterCards();
  renderGalleryHeader();
  renderGallery();
  renderHistory();
}

function renderGalleryShell() {
  const showingChooser = galleryMode === "chooser";
  elements.galleryChooser.hidden = !showingChooser;
  elements.galleryDetail.hidden = showingChooser;
}

function renderCharacterCards() {
  const selectedId = state.currentCharacterId;
  elements.characterCardRow.innerHTML = characters
    .map((character) => {
      const progress = getProgressForCharacter(character.characterId);
      const characterEpisodes = getEpisodesForCharacter(character.characterId);
      const total = characterEpisodes.length;
      const unlocked = Math.min(progress.storyProgress, total);
      const progressPct = total ? Math.min(100, (unlocked / total) * 100) : 0;
      const isSelected = character.characterId === selectedId;
      const progressLabel = total ? `${unlocked} / ${total} 段回忆` : "剧情准备中";

      return `
        <button
          class="skill-character-card ${isSelected ? "is-selected" : ""}"
          data-character-gallery="${character.characterId}"
          type="button"
          aria-current="${isSelected ? "true" : "false"}"
          style="--mx: 50%; --my: 42%;"
        >
          <span class="skill-card-shine" aria-hidden="true"></span>
          <span class="skill-card-glare" aria-hidden="true"></span>
          <span class="skill-card-frame">
            <span class="skill-card-status">${escapeHtml(character.galleryStatus)}</span>
            <span class="skill-card-portrait">
              <img src="${escapeHtml(character.portrait)}" alt="${escapeHtml(character.characterName)}立绘" />
            </span>
            <span class="skill-card-body">
              <span class="skill-card-type">${escapeHtml(character.style)}</span>
              <strong>${escapeHtml(character.characterName)}</strong>
              <span>${escapeHtml(character.description)}</span>
            </span>
            <span class="skill-card-progress" aria-label="${escapeHtml(progressLabel)}">
              <span style="width: ${progressPct}%"></span>
            </span>
            <span class="skill-card-foot">
              <span>${escapeHtml(progressLabel)}</span>
              <span>进入画廊</span>
            </span>
          </span>
        </button>
      `;
    })
    .join("");
}

function updateCardPointer(event) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const card = event.target.closest("[data-character-gallery]");
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
  const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
  const rotateX = ((50 - y) / 50) * 5;
  const rotateY = ((x - 50) / 50) * 6;

  card.style.setProperty("--mx", `${x}%`);
  card.style.setProperty("--my", `${y}%`);
  card.style.setProperty("--rx", `${rotateX}deg`);
  card.style.setProperty("--ry", `${rotateY}deg`);
}

function resetCardPointer(event) {
  const card = event.target.closest("[data-character-gallery]");
  const cards = card ? [card] : [...event.currentTarget.querySelectorAll("[data-character-gallery]")];
  cards.forEach((item) => {
    item.style.setProperty("--mx", "50%");
    item.style.setProperty("--my", "42%");
    item.style.setProperty("--rx", "0deg");
    item.style.setProperty("--ry", "0deg");
  });
}

function renderGalleryHeader() {
  const character = getCurrentCharacter();
  const progress = getCurrentProgress();
  const episodeCount = getCurrentCharacterEpisodes().length;
  const unlocked = Math.min(progress.storyProgress, episodeCount);
  const voiceEpisode = getCurrentCharacterVoiceEpisode();

  elements.galleryCharacterKicker.textContent = episodeCount ? `${unlocked} / ${episodeCount} 段回忆` : "角色剧情准备中";
  elements.galleryCharacterName.textContent = `${character.characterName}的画廊`;
  elements.voicePreviewButton.textContent = voiceEpisode ? `试听${character.characterName}语音` : "语音准备中";
  elements.voicePreviewButton.disabled = !voiceEpisode;
}

function renderGallery() {
  const galleryByEpisode = new Map(state.gallery.map((item) => [item.episodeId, item]));
  const character = getCurrentCharacter();
  const characterEpisodes = getCurrentCharacterEpisodes();

  if (!characterEpisodes.length) {
    elements.galleryGrid.innerHTML = `
      <article class="gallery-empty">
        <h2>${escapeHtml(character.characterName)}的剧情还在准备中</h2>
        <p>角色已经加入画廊。等剧情和语音资源补上后，这里会显示她的专属回忆。</p>
      </article>
    `;
    return;
  }

  elements.galleryGrid.innerHTML = characterEpisodes
    .map((episode, index) => {
      const item = galleryByEpisode.get(episode.episodeId);
      if (!item) {
        return `
          <article class="gallery-card gallery-card-locked" aria-label="未解锁回忆">
            <div class="gallery-card-topline">
              <span>第 ${index + 1} 段回忆</span>
              <span class="gallery-lock-mark">未解锁</span>
            </div>
            <div class="gallery-memory-seal" aria-hidden="true">?</div>
            <h2>新的回忆正在等你</h2>
            <p>完成第 ${episode.requiredPomodoros} 个番茄后，这一页会慢慢亮起来。</p>
          </article>
        `;
      }
      return `
        <article class="gallery-card gallery-card-unlocked">
          <div class="gallery-card-topline">
            <span>第 ${index + 1} 段回忆</span>
            <time>${formatDate(item.unlockedAt)}</time>
          </div>
          <h2>${escapeHtml(item.title)}</h2>
          <p>${escapeHtml(item.unlockText)}</p>
          ${item.taskText ? `<p><strong>本轮任务：</strong>${escapeHtml(item.taskText)}</p>` : ""}
          <button class="soft-action" type="button" data-replay="${item.episodeId}">回放文字语音</button>
        </article>
      `;
    })
    .join("");
  elements.galleryGrid.querySelectorAll("[data-replay]").forEach((button) => {
    button.addEventListener("click", () => {
      const episode = getEpisode(button.dataset.replay);
      playLine(episode?.endLine || "这是你已经解锁的剧情。", "replay", episode);
    });
  });
}

function renderHistory() {
  if (!state.taskHistory.length) {
    elements.taskHistory.innerHTML = "<li><span>还没有完成记录</span><time></time></li>";
    return;
  }
  elements.taskHistory.innerHTML = state.taskHistory
    .map(
      (item) =>
        `<li><span>${escapeHtml(item.taskText || "未命名任务")} · ${item.focusMinutes} 分钟</span><time>${formatDate(item.completedAt)}</time></li>`,
    )
    .join("");
}

function renderUnlock(episode) {
  if (!episode) return;
  elements.unlockedTitle.textContent = episode.title;
  elements.unlockRibbon.hidden = false;
  window.setTimeout(() => {
    elements.unlockRibbon.hidden = true;
  }, 7000);
}

function startTicker() {
  window.clearInterval(timerTick);
  timerTick = window.setInterval(() => {
    const status = state.timerState.status;
    if (status === "focusing" && getRemainingMs() <= 0) {
      completePomodoro();
    } else if (status === "break" && getRemainingMs() <= 0) {
      finishBreak();
    } else {
      render();
    }
  }, 1000);
}

function getRemainingMs() {
  const timer = state.timerState;
  if (timer.status === "paused") return Math.max(0, timer.remainingAtPauseMs || 0);
  if (["focusing", "break"].includes(timer.status)) return Math.max(0, timer.endTime - Date.now());
  if (["story", "completed"].includes(timer.status)) return 0;
  return (timer.focusMinutes || state.settings.defaultFocusMinutes) * 60 * 1000;
}

function getStatusLabel(status) {
  return {
    idle: "等待开始",
    focusing: "专注中",
    paused: "已暂停",
    break: "休息中",
    completed: "已完成",
    story: "剧情中",
  }[status] || "等待开始";
}

function getCurrentProgress() {
  return getProgressForCharacter(state.currentCharacterId);
}

function getProgressForCharacter(characterId) {
  if (!state.characters[characterId]) {
    state.characters[characterId] = {
      completedPomodoros: 0,
      storyProgress: 0,
      unlockedEpisodeIds: [],
    };
  }
  return state.characters[characterId];
}

function getCurrentCharacter() {
  return characters.find((character) => character.characterId === state.currentCharacterId) || characters[0];
}

function getCurrentCharacterEpisodes() {
  return getEpisodesForCharacter(state.currentCharacterId);
}

function getEpisodesForCharacter(characterId) {
  return episodes.filter((episode) => episode.characterId === characterId);
}

function getNextEpisode() {
  const progress = getCurrentProgress();
  return getCurrentCharacterEpisodes().find(
    (episode) =>
      episode.requiredPomodoros === progress.storyProgress + 1,
  );
}

function getEpisode(episodeId) {
  return episodes.find((episode) => episode.episodeId === episodeId);
}

function getPomodoroCharacterId() {
  const options = [...elements.characterSelect.options].map((option) => option.value);
  if (options.includes(state.currentCharacterId)) return state.currentCharacterId;
  return options[0] || characters[0].characterId;
}

function getCurrentCharacterVoiceEpisode() {
  const character = getCurrentCharacter();
  const sampleEpisode = character.voiceSampleEpisodeId ? getEpisode(character.voiceSampleEpisodeId) : null;
  if (sampleEpisode?.startVoice || sampleEpisode?.endVoice) return sampleEpisode;
  if (character.voiceSampleSrc) {
    return {
      startVoice: character.voiceSampleSrc,
      startLine: character.voiceSampleLine || `${character.characterName}\u5728\u8fd9\u91cc\u3002`,
    };
  }
  return getCurrentCharacterEpisodes().find((episode) => episode.startVoice || episode.endVoice) || null;
}

function previewCurrentCharacterVoice() {
  const episode = getCurrentCharacterVoiceEpisode();
  const character = getCurrentCharacter();
  if (!episode) {
    toast(`${character.characterName}的语音还在准备中。`);
    return;
  }
  playLine(episode.startLine || episode.endLine || `${character.characterName}在这里。`, "start", episode);
}

function getCurrentBreakStory() {
  if (state.timerState.status !== "break" || !state.timerState.episodeId) return null;
  const galleryItem = state.gallery.find((item) => item.episodeId === state.timerState.episodeId);
  if (galleryItem?.unlockText) {
    return {
      title: galleryItem.title,
      unlockText: galleryItem.unlockText,
    };
  }
  const episode = getEpisode(state.timerState.episodeId);
  if (!episode?.unlockText) return null;
  return {
    title: episode.title,
    unlockText: episode.unlockText,
  };
}

function getCurrentLine() {
  const timer = state.timerState;
  const episode = getEpisode(timer.episodeId) || getNextEpisode();
  if (timer.status === "focusing") return episode?.startLine || "我在这里，陪你完成这一轮。";
  if (timer.status === "paused") return "暂停一下也没关系。回来时，我们从这里继续。";
  if (timer.status === "break") return episode?.endLine || "先休息一下，眼睛也需要被照顾。";
  return getNextEpisode()?.startLine || "你已经完成了当前的 v1 剧情，新的故事以后再来。";
}

function playLine(line, phase = "replay", episode = null) {
  elements.currentLine.textContent = line;
  elements.focusLine.textContent = line;
  playVoice(line, phase, episode);
}

function playVoice(line, phase, episode) {
  if (state.settings.muted) return;
  const source = phase === "start" ? episode?.startVoice : episode?.endVoice;
  if (!source) {
    speakLine(line);
    return;
  }
  if (voiceAudio) {
    voiceAudio.pause();
    voiceAudio = null;
  }
  voiceAudio = new Audio(source);
  voiceAudio.volume = state.settings.voiceVolume;
  voiceAudio.addEventListener("error", () => speakLine(line), { once: true });
  voiceAudio.play().catch(() => speakLine(line));
}

function speakLine(line) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(line);
    utterance.lang = "zh-CN";
    utterance.volume = state.settings.voiceVolume;
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
    return;
  }
  softBeep(state.settings.voiceVolume);
}

function getAudioEngine() {
  if (audioEngine) return audioEngine;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = state.settings.musicVolume;
  master.connect(ctx.destination);
  audioEngine = { ctx, master, nodes: [] };
  return audioEngine;
}

function startMusic() {
  if (state.settings.muted) return;
  const engine = getAudioEngine();
  if (!engine) return;
  stopMusic(false);
  engine.ctx.resume();
  engine.master.gain.value = state.settings.musicVolume;
  const music = musicCatalog.find((item) => item.id === state.settings.musicId) || musicCatalog[0];

  if (music.src) {
    let fallbackStarted = false;
    const fallback = () => {
      if (fallbackStarted) return;
      fallbackStarted = true;
      startGeneratedMusic(engine, music);
    };
    musicAudio = new Audio(music.src);
    musicAudio.loop = true;
    musicAudio.volume = state.settings.musicVolume;
    musicAudio.addEventListener("error", fallback, { once: true });
    musicAudio.play().catch(fallback);
    return;
  }

  startGeneratedMusic(engine, music);
}

function stopMusic(close = true) {
  if (musicAudio) {
    musicAudio.pause();
    musicAudio = null;
  }
  if (!audioEngine) return;
  audioEngine.nodes.forEach((node) => {
    try {
      if (typeof node.stop === "function") node.stop();
      if (typeof node.disconnect === "function") node.disconnect();
    } catch {
      // Audio nodes may already be stopped by the browser.
    }
  });
  audioEngine.nodes = [];
  if (close) updateMusicVolume();
}

function updateMusicVolume() {
  if (!audioEngine) return;
  audioEngine.master.gain.value = state.settings.musicVolume;
  if (musicAudio) musicAudio.volume = state.settings.musicVolume;
}

function startGeneratedMusic(engine, music) {
  if (music.tone === "rain") createNoiseLoop(engine, 900);
  if (music.tone === "cafe") createToneLoop(engine, 146.83, 196);
  if (music.tone === "fire") createNoiseLoop(engine, 180);
}

function createToneLoop(engine, freqA, freqB) {
  const oscA = engine.ctx.createOscillator();
  const oscB = engine.ctx.createOscillator();
  const gain = engine.ctx.createGain();
  oscA.frequency.value = freqA;
  oscB.frequency.value = freqB;
  oscA.type = "sine";
  oscB.type = "triangle";
  gain.gain.value = 0.08;
  oscA.connect(gain);
  oscB.connect(gain);
  gain.connect(engine.master);
  oscA.start();
  oscB.start();
  engine.nodes.push(oscA, oscB, gain);
}

function createNoiseLoop(engine, filterFreq) {
  const bufferSize = engine.ctx.sampleRate * 2;
  const buffer = engine.ctx.createBuffer(1, bufferSize, engine.ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = engine.ctx.createBufferSource();
  const filter = engine.ctx.createBiquadFilter();
  const gain = engine.ctx.createGain();
  noise.buffer = buffer;
  noise.loop = true;
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  gain.gain.value = 0.1;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(engine.master);
  noise.start();
  engine.nodes.push(noise, filter, gain);
}

function softBeep(volume) {
  const engine = getAudioEngine();
  if (!engine) return;
  engine.ctx.resume();
  const osc = engine.ctx.createOscillator();
  const gain = engine.ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 523.25;
  gain.gain.setValueAtTime(Math.max(0.01, volume * 0.16), engine.ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, engine.ctx.currentTime + 0.6);
  osc.connect(gain);
  gain.connect(engine.ctx.destination);
  osc.start();
  osc.stop(engine.ctx.currentTime + 0.62);
}

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2600);
}
}
