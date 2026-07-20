import { computed, ref } from "vue";
import { defineStore } from "pinia";

export interface LocalUser {
  id: string;
  displayName: string;
  storageMode: "local";
}

export const useAuthStore = defineStore("auth", () => {
  const currentUser = ref<LocalUser>({
    id: "local_user",
    displayName: "本地用户",
    storageMode: "local",
  });

  return {
    currentUser,
    isAuthenticated: computed(() => Boolean(currentUser.value.id)),
    isCloudSyncEnabled: computed(() => false),
  };
});
