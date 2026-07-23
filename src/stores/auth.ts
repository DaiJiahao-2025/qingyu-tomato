import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { apiLogin, apiRegister, configureApi, type CloudUser } from "@/services/api";
import { fullResync, resetSyncMeta, syncStatus, lastSyncedAtRef, syncErrorRef } from "@/services/sync";

export const AUTH_STORAGE_KEY = "fanqieqingyu:auth:v1";

interface StoredAuth {
  token: string;
  user: CloudUser;
}

function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAuth>;
    if (typeof parsed.token !== "string" || !parsed.user) return null;
    return parsed as StoredAuth;
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore("auth", () => {
  const stored = loadStoredAuth();
  const token = ref<string | null>(stored?.token ?? null);
  const user = ref<CloudUser | null>(stored?.user ?? null);
  const authBusy = ref(false);

  function persistAuth(): void {
    if (token.value && user.value) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: token.value, user: user.value }));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  function applyAuth(result: { token: string; user: CloudUser }): void {
    token.value = result.token;
    user.value = result.user;
    persistAuth();
  }

  async function register(email: string, password: string, displayName?: string): Promise<void> {
    authBusy.value = true;
    try {
      applyAuth(await apiRegister(email, password, displayName));
      await fullResync();
    } finally {
      authBusy.value = false;
    }
  }

  async function login(email: string, password: string): Promise<void> {
    authBusy.value = true;
    try {
      applyAuth(await apiLogin(email, password));
      await fullResync();
    } finally {
      authBusy.value = false;
    }
  }

  /** 退出登录：清 token 与同步游标，本地数据保留（回到游客模式） */
  function logout(): void {
    token.value = null;
    user.value = null;
    persistAuth();
    resetSyncMeta();
  }

  // token 过期时由 API 层触发登出（数据留在本地，重新登录后再合并）
  configureApi({
    getToken: () => token.value,
    onUnauthorized: () => {
      if (token.value) logout();
    },
  });

  return {
    token,
    user,
    authBusy,
    syncStatus,
    lastSyncedAt: lastSyncedAtRef,
    syncError: syncErrorRef,
    isCloudSyncEnabled: computed(() => Boolean(token.value)),
    register,
    login,
    logout,
  };
});
