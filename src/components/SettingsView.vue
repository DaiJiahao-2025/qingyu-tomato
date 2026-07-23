<template>
  <section
    class="view"
    :class="{ 'is-visible': store.activeView === 'settings' }"
    data-view="settings"
  >
    <div class="page-title">
      <p>设置</p>
    </div>
    <div class="settings-panel">
      <section class="settings-group">
        <div class="section-heading">
          <p>时间</p>
          <h2>默认节奏</h2>
        </div>
        <div class="settings-fields">
          <label class="field compact" for="defaultFocusInput">
            <span>默认番茄时长</span>
            <ElInputNumber
              id="defaultFocusInput"
              v-model="store.settings.defaultFocusMinutes"
              :min="25"
              :step="5"
              controls-position="right"
              @change="store.persist()"
            />
          </label>
          <label class="field compact" for="breakMinutesInput">
            <span>休息时长</span>
            <ElInputNumber
              id="breakMinutesInput"
              v-model="store.settings.breakMinutes"
              :min="1"
              :step="1"
              controls-position="right"
              @change="store.persist()"
            />
          </label>
        </div>
      </section>

      <section class="settings-group">
        <div class="section-heading">
          <p>声音</p>
          <h2>陪伴音量</h2>
        </div>
        <div class="settings-fields">
          <label class="field" for="voiceVolumeInput">
            <span>语音音量</span>
            <ElSlider
              id="voiceVolumeInput"
              v-model="store.settings.voiceVolume"
              :max="1"
              :min="0"
              :step="0.05"
              :format-tooltip="formatVolume"
              @change="store.persist()"
            />
          </label>
          <label class="field" for="musicVolumeInput">
            <span>音乐音量</span>
            <ElSlider
              id="musicVolumeInput"
              v-model="store.settings.musicVolume"
              :max="1"
              :min="0"
              :step="0.05"
              :format-tooltip="formatVolume"
              @change="store.persist()"
            />
          </label>
          <label class="settings-switch-row" for="settingsMutedToggle">
            <span><strong>静音模式</strong><small>关闭背景音乐和角色语音</small></span>
            <ElSwitch id="settingsMutedToggle" v-model="store.settings.muted" @change="store.persist()" />
          </label>
        </div>
      </section>

      <section class="settings-group" data-testid="account-sync-group">
        <div class="section-heading">
          <p>账号</p>
          <h2>账号与同步</h2>
        </div>
        <div v-if="!auth.isCloudSyncEnabled" class="settings-fields">
          <p class="account-hint">当前为游客模式，数据仅保存在本机浏览器。登录后可多设备同步，清库也不怕丢进度。</p>
          <ElButton id="openAuthButton" type="primary" plain @click="authModalVisible = true">
            登录 / 注册
          </ElButton>
        </div>
        <div v-else class="settings-fields">
          <div class="account-row">
            <span class="account-email">{{ auth.user?.displayName }}（{{ auth.user?.email }}）</span>
            <span class="account-status" :data-status="auth.syncStatus">{{ syncStatusText }}</span>
          </div>
          <p class="account-hint">{{ lastSyncedText }}</p>
          <p v-if="auth.syncError" class="account-error">{{ auth.syncError }}</p>
          <div class="account-actions">
            <ElButton id="manualSyncButton" :loading="auth.syncStatus === 'syncing'" @click="manualSync">
              手动同步
            </ElButton>
            <ElButton id="logoutButton" plain @click="handleLogout">退出登录</ElButton>
          </div>
        </div>
      </section>

      <section class="settings-group history-panel">
        <FocusHistoryTable />
        <ElButton
          id="clearDataButton"
          type="danger"
          plain
          @click="store.clearAllData()"
        >
          清除本地数据
        </ElButton>
      </section>
    </div>
    <AuthModal v-model="authModalVisible" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import { flushSync } from "@/services/sync";
import ElButton from "element-plus/es/components/button/index.mjs";
import ElInputNumber from "element-plus/es/components/input-number/index.mjs";
import ElSlider from "element-plus/es/components/slider/index.mjs";
import ElSwitch from "element-plus/es/components/switch/index.mjs";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/input-number/style/css";
import "element-plus/es/components/slider/style/css";
import "element-plus/es/components/switch/style/css";
import FocusHistoryTable from "@/components/FocusHistoryTable.vue";
import AuthModal from "@/components/AuthModal.vue";

const store = useAppStore();
const auth = useAuthStore();
const authModalVisible = ref(false);

const syncStatusText = computed(() => {
  switch (auth.syncStatus) {
    case "syncing":
      return "同步中…";
    case "error":
      return "同步失败";
    case "offline":
      return "离线，恢复网络后自动同步";
    default:
      return "已同步";
  }
});

const lastSyncedText = computed(() => {
  if (!auth.lastSyncedAt) return "尚未同步";
  return `上次同步：${new Date(auth.lastSyncedAt).toLocaleString()}`;
});

async function manualSync(): Promise<void> {
  await flushSync();
  if (auth.syncStatus === "idle") store.toast("同步完成。");
}

function handleLogout(): void {
  auth.logout();
  store.toast("已退出登录，数据保留在本机。");
}

function formatVolume(value: number): string {
  return `${Math.round(value * 100)}%`;
}
</script>

<style scoped>
.account-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.account-email {
  font-weight: 600;
}

.account-status {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--surface-soft, #f4ece5);
  color: var(--text-muted, #9b8f86);
}

.account-status[data-status="syncing"] {
  color: var(--el-color-primary, #e07b4f);
}

.account-status[data-status="error"],
.account-status[data-status="offline"] {
  color: var(--el-color-danger, #c45656);
}

.account-hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted, #9b8f86);
}

.account-error {
  margin: 0;
  font-size: 13px;
  color: var(--el-color-danger, #c45656);
}

.account-actions {
  display: flex;
  gap: 10px;
}
</style>
