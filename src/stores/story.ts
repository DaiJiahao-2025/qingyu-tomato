import { computed } from "vue";
import { defineStore } from "pinia";
import { useAppStore } from "@/stores/app";

export const useStoryStore = defineStore("story", () => {
  const app = useAppStore();
  return {
    episodes: computed(() => app.episodes),
    gallery: computed(() => app.gallery),
    characters: computed(() => app.characterCardData),
    currentCharacter: computed(() => app.currentCharacter),
    currentProgress: computed(() => app.characterProgress),
    selectCharacter: app.selectCharacterGallery,
  };
});
