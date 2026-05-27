<template>
  <div class="app-shell">
    <aside class="side-rail" aria-label="主要导航">
      <div class="brand-lockup" aria-label="番茄轻语">
      </div>
      <nav class="nav-tabs">
        <button class="nav-button is-active" data-view-target="home" type="button">
          <span>⌂</span> 首页
        </button>
        <button class="nav-button" data-view-target="gallery" type="button">
          <span>◇</span> 画廊
        </button>
        <button class="nav-button" data-view-target="settings" type="button">
          <span>⚙</span> 设置
        </button>
      </nav>
      <div class="rail-note">
        <span>今日专注</span>
        <strong id="railTodayCount">0</strong>
      </div>
    </aside>

    <main class="workspace">
      <section class="view view-home is-visible" data-view="home">
        <div class="home-focus-shell">
          <div class="home-empty-state" id="homeEmptyState">
            <button class="add-pomodoro-button" id="focusStartButton" type="button" aria-label="添加番茄钟">
              <span>+</span>
            </button>
          </div>

          <article class="immersive-timer" id="immersiveTimer" aria-label="当前番茄钟" hidden>
            <img class="immersive-character-image" data-character-image alt="岁岁立绘" />
            <div class="immersive-character-fallback" aria-hidden="true">
              <div class="portrait-figure">
                <span class="hair"></span>
                <span class="face"></span>
                <span class="collar"></span>
                <span class="book"></span>
              </div>
            </div>
            <div class="timer-focus-card">
              <div class="timer-orbit" id="timerOrbit">
                <div class="timer-core">
                  <span id="timerStateLabel">等待开始</span>
                  <strong id="timeRemaining">25:00</strong>
                  <small id="activeTask">还没有本轮任务</small>
                </div>
              </div>
              <article class="break-story-panel" id="breakStoryPanel" aria-labelledby="breakStoryTitle" hidden>
                <p>新剧情已解锁</p>
                <h2 id="breakStoryTitle"></h2>
                <div id="breakStoryText"></div>
              </article>
              <p class="home-line" id="currentLine">这 25 分钟我也会看书，我们一起开始吧。</p>
              <span id="focusLine" hidden>先写下一件小事，我们再一起开始。</span>
              <div class="timer-controls">
                <button class="soft-action" id="pauseResumeButton" type="button">暂停</button>
                <button class="danger-action" id="exitButton" type="button">退出本轮</button>
                <button class="soft-action" id="skipBreakButton" type="button">跳过休息</button>
                <button class="primary-action" id="continueNextButton" type="button" hidden>继续下一轮</button>
                <button class="danger-action" id="finishSessionButton" type="button" hidden>退出</button>
              </div>
              <div class="story-ribbon" id="unlockRibbon" hidden>
                <span>新剧情已解锁</span>
                <strong id="unlockedTitle"></strong>
              </div>
            </div>
            <a class="gallery-shortcut" data-view-target="gallery" href="#gallery">已解锁剧情</a>
          </article>
        </div>
      </section>

      <section class="view" data-view="gallery">
        <section class="gallery-chooser" aria-label="选择角色进入画廊。">
          <div class="skill-card-row" id="characterCardRow" aria-label="角色画廊"></div>
        </section>
        <section class="gallery-detail" data-gallery-detail hidden>
          <div class="gallery-character-bar">
            <button class="soft-action gallery-back-button" id="galleryBackButton" type="button">返回角色选择</button>
            <div>
              <p id="galleryCharacterKicker">当前角色</p>
              <h2 id="galleryCharacterName">岁岁</h2>
            </div>
            <button class="soft-action" id="voicePreviewButton" type="button">试听角色语音</button>
          </div>
          <div class="page-title">
            <p>剧情画廊</p>
            <h1>已解锁的片段</h1>
          </div>
          <div class="gallery-grid" id="galleryGrid"></div>
        </section>
      </section>

      <section class="view" data-view="settings">
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
              <label class="field compact">
                <span>默认番茄时长</span>
                <input id="defaultFocusInput" min="25" step="5" type="number" />
              </label>
              <label class="field compact">
                <span>休息时长</span>
                <input id="breakMinutesInput" min="1" step="1" type="number" />
              </label>
            </div>
          </section>

          <section class="settings-group">
            <div class="section-heading">
              <p>声音</p>
              <h2>陪伴音量</h2>
            </div>
            <div class="settings-fields">
              <label class="field">
                <span>语音音量</span>
                <input id="voiceVolumeInput" max="1" min="0" step="0.05" type="range" />
              </label>
              <label class="field">
                <span>音乐音量</span>
                <input id="musicVolumeInput" max="1" min="0" step="0.05" type="range" />
              </label>
            </div>
          </section>

          <section class="settings-group history-panel">
            <div class="section-heading">
              <p>本地记录</p>
              <h2>最近完成任务</h2>
            </div>
            <ul id="taskHistory"></ul>
            <button class="danger-action" id="clearDataButton" type="button">清除本地数据</button>
          </section>
        </div>
      </section>
    </main>
  </div>

  <div class="start-modal" id="startModal" hidden>
    <article class="start-card start-dialog" id="startPanel" role="dialog" aria-modal="true" aria-labelledby="startTitle">
      <button class="icon-close" id="closeStartModal" type="button" aria-label="关闭">×</button>
      <div class="section-heading">
        <p>新番茄</p>
        <h2 id="startTitle">本轮约定</h2>
      </div>
      <div class="settings-row">
        <label class="field compact">
          <span>专注时长</span>
          <input id="focusMinutesInput" min="25" step="5" type="number" />
        </label>
        <label class="field compact">
          <span>休息时长</span>
          <input id="modalBreakMinutesInput" min="1" step="1" type="number" />
        </label>
      </div>
      <label class="field">
        <span>本轮任务 <em>可空，最大 15 字</em></span>
        <input id="taskInput" maxlength="15" type="text" placeholder="例如：写完项目首页" />
      </label>
      <div class="settings-row">
        <label class="field compact">
          <span>陪伴角色</span>
          <select id="characterSelect">
            <option value="suisui_001">岁岁</option>
          </select>
        </label>
        <label class="field compact">
          <span>背景声音</span>
          <select id="musicSelect"></select>
        </label>
      </div>
      <label class="toggle-row">
        <input id="mutedToggle" type="checkbox" />
        <span>静音模式</span>
      </label>
      <p class="form-error" id="startError" aria-live="polite"></p>
      <button class="primary-action full" id="startButton" type="button">确认开始</button>
    </article>
  </div>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>
</template>

<script setup>
import { onMounted } from "vue";
import { mountPomodoroApp } from "./composables/usePomodoroLegacy.js";

onMounted(() => {
  mountPomodoroApp();
});
</script>
