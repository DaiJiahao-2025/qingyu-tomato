<template>
  <aside class="side-rail" aria-label="主要导航">
    <div class="brand-lockup" aria-label="番茄轻语"></div>
    <nav class="nav-tabs">
      <button
        class="nav-button"
        :class="{ 'is-active': store.activeView === 'home' }"
        data-view-target="home"
        type="button"
        @click="store.navigateTo('home')"
      >
        <span>⌂</span> 首页
      </button>
      <button
        class="nav-button"
        :class="{ 'is-active': store.activeView === 'tasks' }"
        data-view-target="tasks"
        type="button"
        @click="store.navigateTo('tasks')"
      >
        <span>☷</span> 任务
      </button>
      <button
        class="nav-button"
        :class="{ 'is-active': store.activeView === 'dashboard' }"
        data-view-target="dashboard"
        type="button"
        @click="store.navigateTo('dashboard')"
      >
        <span>◒</span> 概览
      </button>
      <button
        class="nav-button"
        :class="{ 'is-active': store.activeView === 'gallery' }"
        data-view-target="gallery"
        type="button"
        @click="store.navigateTo('gallery')"
      >
        <span>◇</span> 画廊
      </button>
      <button
        class="nav-button"
        :class="{ 'is-active': store.activeView === 'settings' }"
        data-view-target="settings"
        type="button"
        @click="store.navigateTo('settings')"
      >
        <span>⚙</span> 设置
      </button>
    </nav>
    <div class="rail-note">
      <span>今日专注</span>
      <strong id="railTodayCount">{{ store.today.completed }}</strong>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useAppStore } from "@/stores/app";
const store = useAppStore();
</script>
