<template>
  <article
    id="immersiveTimer"
    class="immersive-timer"
    aria-label="当前番茄钟"
    :hidden="!store.isTimerActive"
  >
    <img
      class="immersive-character-image"
      data-character-image
      :src="store.currentCharacter.portrait"
      :alt="store.currentCharacter.characterName + '立绘'"
      decoding="async"
      fetchpriority="high"
      @error="(e) => { (e.target as HTMLImageElement).hidden = true; }"
    />
    <div class="immersive-character-fallback" aria-hidden="true">
      <div class="portrait-figure">
        <span class="hair"></span>
        <span class="face"></span>
        <span class="collar"></span>
        <span class="book"></span>
      </div>
    </div>
    <div class="timer-focus-card">
      <div
        id="timerOrbit"
        class="timer-orbit"
        :style="{ '--timer-progress': store.progressPct + '%' }"
      >
        <div class="timer-core">
          <span id="timerStateLabel">{{ store.statusLabel }}</span>
          <strong id="timeRemaining">{{ store.timeDisplay }}</strong>
          <small id="activeTask">{{ store.timerState.taskText || '还没有本轮任务' }}</small>
        </div>
      </div>

      <article
        id="breakStoryPanel"
        class="break-story-panel"
        aria-labelledby="breakStoryTitle"
        :hidden="!store.breakStory"
      >
        <p>新剧情已解锁</p>
        <h2 id="breakStoryTitle">{{ store.breakStory?.title }}</h2>
        <div id="breakStoryText">{{ store.breakStory?.unlockText }}</div>
      </article>

      <p class="home-line" id="currentLine">{{ store.currentLine }}</p>
      <span id="focusLine" hidden>{{ store.currentLine }}</span>

      <div class="timer-controls">
        <button
          id="pauseResumeButton"
          class="soft-action"
          type="button"
          :hidden="!store.timerButtonsVisible.pauseResume"
          @click="store.togglePause()"
        >
          {{ store.pauseResumeLabel }}
        </button>
        <button
          id="exitButton"
          class="danger-action"
          type="button"
          :hidden="!store.timerButtonsVisible.exit"
          @click="store.exitTimer()"
        >
          退出本轮
        </button>
        <button
          id="skipBreakButton"
          class="soft-action"
          type="button"
          :hidden="!store.timerButtonsVisible.skipBreak"
          @click="store.skipBreak()"
        >
          跳过休息
        </button>
        <button
          id="continueNextButton"
          class="primary-action"
          type="button"
          :hidden="!store.timerButtonsVisible.continueNext"
          @click="store.continueNext()"
        >
          继续下一轮
        </button>
        <button
          id="finishSessionButton"
          class="danger-action"
          type="button"
          :hidden="!store.timerButtonsVisible.finishSession"
          @click="store.finishSession()"
        >
          退出
        </button>
      </div>

      <div
        id="unlockRibbon"
        class="story-ribbon"
        :hidden="!store.showUnlockRibbon"
      >
        <span>新剧情已解锁</span>
        <strong id="unlockedTitle">{{ store.unlockedTitle }}</strong>
      </div>
    </div>
    <a
      class="gallery-shortcut"
      data-view-target="gallery"
      href="#gallery"
      @click.prevent="store.navigateTo('gallery')"
    >
      已解锁剧情
    </a>
  </article>
</template>

<script setup lang="ts">
import { useAppStore } from "@/stores/app";

const store = useAppStore();
</script>
