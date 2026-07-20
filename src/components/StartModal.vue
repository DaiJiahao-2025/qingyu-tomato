<template>
  <div id="startModal" class="start-modal" :hidden="!store.showStartModal">
    <article
      id="startPanel"
      class="start-card start-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="startTitle"
    >
      <button
        id="closeStartModal"
        class="icon-close"
        type="button"
        aria-label="关闭"
        @click="store.closeStartModal()"
      >
        &times;
      </button>
      <div class="section-heading">
        <p>新番茄</p>
        <h2 id="startTitle">本轮约定</h2>
      </div>
      <div class="settings-row">
        <label class="field compact">
          <span>专注时长</span>
          <input
            id="focusMinutesInput"
            v-model.number="formFocusMinutes"
            min="25"
            step="5"
            type="number"
          />
        </label>
        <label class="field compact">
          <span>休息时长</span>
          <input
            id="modalBreakMinutesInput"
            v-model.number="formBreakMinutes"
            min="1"
            step="1"
            type="number"
          />
        </label>
      </div>
      <label class="field">
        <span>本轮任务 <em>可空，最大 15 字</em></span>
        <input
          id="taskInput"
          v-model="taskText"
          maxlength="15"
          type="text"
          placeholder="例如：写完项目首页"
        />
      </label>
      <div class="settings-row">
        <label class="field compact">
          <span>陪伴角色</span>
          <select id="characterSelect" v-model="selectedCharacterId">
            <option
              v-for="c in store.charactersDef.filter((c) => c.isAvailable)"
              :key="c.characterId"
              :value="c.characterId"
            >
              {{ c.characterName }}
            </option>
          </select>
        </label>
        <label class="field compact">
          <span>背景声音</span>
          <select id="musicSelect" v-model="selectedMusicId">
            <option
              v-for="m in store.musicCatalog"
              :key="m.id"
              :value="m.id"
            >
              {{ m.name }}
            </option>
          </select>
        </label>
      </div>
      <label class="toggle-row">
        <input id="mutedToggle" v-model="muted" type="checkbox" />
        <span>静音模式</span>
      </label>
      <p id="startError" class="form-error" aria-live="polite">
        {{ errorMessage }}
      </p>
      <button
        id="startButton"
        class="primary-action full"
        type="button"
        @click="confirm"
      >
        确认开始
      </button>
    </article>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useAppStore } from "@/stores/app";

const store = useAppStore();

const formFocusMinutes = ref(store.settings.defaultFocusMinutes);
const formBreakMinutes = ref(store.settings.breakMinutes);
const taskText = ref("");
const selectedCharacterId = ref(store.getPomodoroCharacterId());
const selectedMusicId = ref(store.settings.musicId);
const muted = ref(store.settings.muted);
const errorMessage = ref("");

// Hydrate form when modal opens
watch(
  () => store.showStartModal,
  (visible) => {
    if (visible) {
      formFocusMinutes.value = store.settings.defaultFocusMinutes;
      formBreakMinutes.value = store.settings.breakMinutes;
      taskText.value = "";
      if (store.startTaskId) {
        taskText.value = store.tasks.find((task) => task.id === store.startTaskId)?.title || "";
      }
      selectedCharacterId.value = store.getPomodoroCharacterId();
      selectedMusicId.value = store.settings.musicId;
      muted.value = store.settings.muted;
      errorMessage.value = "";
    }
  }
);

function confirm() {
  errorMessage.value = "";
  const focusMinutes = formFocusMinutes.value || store.settings.defaultFocusMinutes;
  if (focusMinutes < 25) {
    errorMessage.value = "番茄时长不能少于 25 分钟。";
    store.toast("番茄时长不能少于 25 分钟。");
    return;
  }

  store.currentCharacterId = selectedCharacterId.value;
  store.settings.breakMinutes = Math.max(1, formBreakMinutes.value || store.settings.breakMinutes);
  store.settings.musicId = selectedMusicId.value;
  store.settings.muted = muted.value;
  store.persist();

  store.startTimer({
    taskText: taskText.value.trim().slice(0, 15),
    focusMinutes,
    taskId: store.startTaskId,
  });
}
</script>
