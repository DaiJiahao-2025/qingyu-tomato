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
  </section>
</template>

<script setup lang="ts">
import { useAppStore } from "@/stores/app";
import ElButton from "element-plus/es/components/button/index.mjs";
import ElInputNumber from "element-plus/es/components/input-number/index.mjs";
import ElSlider from "element-plus/es/components/slider/index.mjs";
import ElSwitch from "element-plus/es/components/switch/index.mjs";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/input-number/style/css";
import "element-plus/es/components/slider/style/css";
import "element-plus/es/components/switch/style/css";
import FocusHistoryTable from "@/components/FocusHistoryTable.vue";

const store = useAppStore();

function formatVolume(value: number): string {
  return `${Math.round(value * 100)}%`;
}
</script>
