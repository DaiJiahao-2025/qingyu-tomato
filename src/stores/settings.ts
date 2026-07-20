import { computed } from "vue";
import { defineStore } from "pinia";
import { useAppStore } from "@/stores/app";

export const useSettingsStore = defineStore("settings", () => {
  const app = useAppStore();
  return {
    settings: computed(() => app.settings),
    musicCatalog: computed(() => app.musicCatalog),
    updateSettings: app.updateSettings,
  };
});
