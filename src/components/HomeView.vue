<template>
  <section
    class="view view-home"
    :class="{ 'is-visible': store.activeView === 'home' }"
    data-view="home"
  >
    <div class="home-focus-shell">
      <div id="homeEmptyState" class="home-empty-state" :hidden="store.isTimerActive">
        <button
          id="focusStartButton"
          class="add-pomodoro-button"
          type="button"
          aria-label="添加番茄钟"
          :hidden="!store.timerButtonsVisible.focusStart"
          @click="store.openStartModal()"
        >
          <span>+</span>
        </button>
      </div>

      <ImmersiveTimer />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useAppStore } from "@/stores/app";
import ImmersiveTimer from "./ImmersiveTimer.vue";

const store = useAppStore();
</script>
