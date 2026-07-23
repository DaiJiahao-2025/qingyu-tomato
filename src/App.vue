<template>
  <div class="app-shell">
    <SideRail />
    <main class="workspace">
      <HomeView />
      <DashboardView v-if="store.activeView === 'dashboard'" />
      <TaskView v-if="store.activeView === 'tasks'" />
      <GalleryView />
      <SettingsView v-if="store.activeView === 'settings'" />
    </main>
  </div>
  <StartModal />
  <ToastHost />
</template>

<script setup lang="ts">
import { defineAsyncComponent, onMounted } from "vue";
import { useAppStore } from "@/stores/app";
import { startTicker } from "@/composables/useTicker";
import { initSyncEngine } from "@/services/sync";
import SideRail from "@/components/SideRail.vue";
import HomeView from "@/components/HomeView.vue";
import GalleryView from "@/components/GalleryView.vue";
import StartModal from "@/components/StartModal.vue";
import ToastHost from "@/components/ToastHost.vue";

const store = useAppStore();
const DashboardView = defineAsyncComponent(() => import("@/components/DashboardView.vue"));
const TaskView = defineAsyncComponent(() => import("@/components/TaskView.vue"));
const SettingsView = defineAsyncComponent(() => import("@/components/SettingsView.vue"));

onMounted(async () => {
  await store.init();
  startTicker();
  initSyncEngine();
});
</script>
