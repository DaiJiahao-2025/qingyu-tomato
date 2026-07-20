import { computed } from "vue";
import { defineStore } from "pinia";
import { useAppStore } from "@/stores/app";

export const useFocusStore = defineStore("focus", () => {
  const app = useAppStore();
  const timerState = computed(() => app.timerState);
  const isActive = computed(() => app.isTimerActive);

  return {
    timerState,
    isActive,
    remainingMs: computed(() => app.remainingMs),
    startTimer: app.startTimer,
    togglePause: app.togglePause,
    exitTimer: app.exitTimer,
    completePomodoro: app.completePomodoro,
  };
});
