// ============================================================
// Timer ticker — 1s polling loop.
// Triggers store.doTick() each second which forces reactive time
// computeds (remainingMs, timeDisplay, progressPct) to re-evaluate.
// Also triggers expire detection and persist for refresh-recovery.
// ============================================================

import { useAppStore } from "@/stores/app";

let timerTick: ReturnType<typeof setInterval> | null = null;
let lastPersistAt = 0;
let visibilityHandler: (() => void) | null = null;
const PERSIST_INTERVAL_MS = 5000;

export function startTicker(): void {
  const store = useAppStore();
  clearTicker();
  lastPersistAt = Date.now();
  visibilityHandler = () => {
    if (document.visibilityState === "hidden" && ["focusing", "break"].includes(store.timerState.status)) {
      store.persist();
      lastPersistAt = Date.now();
    }
  };
  document.addEventListener("visibilitychange", visibilityHandler);
  timerTick = setInterval(() => {
    // Force reactive time computeds to re-evaluate (they depend on tick counter)
    store.doTick();

    const status = store.timerState.status;
    if (status === "focusing" && store.remainingMs <= 0) {
      store.completePomodoro();
    } else if (status === "break" && store.remainingMs <= 0) {
      store.finishBreak();
    }
    if (["focusing", "break"].includes(status) && Date.now() - lastPersistAt >= PERSIST_INTERVAL_MS) {
      store.persist();
      lastPersistAt = Date.now();
    }
  }, 1000);
}

export function clearTicker(): void {
  if (timerTick !== null) {
    clearInterval(timerTick);
    timerTick = null;
  }
  if (visibilityHandler) {
    document.removeEventListener("visibilitychange", visibilityHandler);
    visibilityHandler = null;
  }
}
