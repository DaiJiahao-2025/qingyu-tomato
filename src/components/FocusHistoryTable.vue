<template>
  <section class="history-workspace" aria-labelledby="historyTitle">
    <div class="section-heading history-heading">
      <div>
        <p>专注记录</p>
        <h2 id="historyTitle">每一次完成都有迹可循</h2>
      </div>
      <span class="history-count" :data-total-count="filteredSessions.length">
        {{ filteredSessions.length }} 条记录
      </span>
    </div>

    <FilterBar @reset="resetFilters">
      <BaseInput id="historyKeywordInput" v-model="keyword" label="关键词" type="search" placeholder="搜索任务" />
      <BaseSelect id="historyDateFilter" v-model="dateRange" label="时间范围" :options="dateOptions" />
      <BaseSelect id="historyDurationFilter" v-model="minimumMinutes" label="专注时长" :options="durationOptions" />
    </FilterBar>

    <div v-if="!filteredSessions.length" id="taskHistory" class="history-empty">当前筛选下没有专注记录</div>
    <VirtualList
      v-else
      id="taskHistory"
      :items="filteredSessions"
      :item-height="64"
      :height="Math.min(420, Math.max(128, filteredSessions.length * 64))"
      :overscan="5"
      item-key="id"
    >
      <template #default="{ item }">
        <article class="history-row">
          <div class="history-row-main">
            <strong>{{ item.taskText || '未命名专注' }}</strong>
            <span>{{ projectName(item.taskId) }} · {{ characterName(item.characterId) }}</span>
          </div>
          <span class="history-duration">{{ item.focusMinutes }} 分钟</span>
          <time :datetime="item.completedAt">{{ formatDate(item.completedAt) }}</time>
          <span class="history-status">已完成</span>
        </article>
      </template>
    </VirtualList>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useAppStore } from "@/stores/app";
import FilterBar from "@/components/ui/FilterBar.vue";
import BaseInput from "@/components/ui/BaseInput.vue";
import BaseSelect from "@/components/ui/BaseSelect.vue";
import VirtualList from "@/components/ui/VirtualList.vue";
import type { FocusSession } from "@/types";

const app = useAppStore();
const keyword = ref("");
const dateRange = ref("all");
const minimumMinutes = ref("0");
const dateOptions = [
  { label: "全部时间", value: "all" },
  { label: "今天", value: "today" },
  { label: "最近 7 天", value: "week" },
];
const durationOptions = [
  { label: "全部时长", value: "0" },
  { label: "至少 25 分钟", value: "25" },
  { label: "至少 45 分钟", value: "45" },
];

const performanceSessions = computed<FocusSession[]>(() => {
  if (new URLSearchParams(window.location.search).get("perf") !== "1") return [];
  const now = Date.now();
  return Array.from({ length: 5000 }, (_, index) => ({
    id: `perf_session_${index}`,
    workspaceId: app.currentWorkspaceId,
    userId: "perf_user",
    taskId: null,
    characterId: index % 2 ? "suisui_001" : "yaya_001",
    taskText: `性能测试任务 ${index + 1}`,
    focusMinutes: index % 3 ? 25 : 45,
    startedAt: new Date(now - index * 3_600_000).toISOString(),
    completedAt: new Date(now - index * 3_600_000).toISOString(),
    status: "completed",
  }));
});

const sourceSessions = computed(() => performanceSessions.value.length ? performanceSessions.value : app.focusSessions);
const filteredSessions = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  const threshold = Number(minimumMinutes.value) || 0;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (dateRange.value === "week") start.setDate(start.getDate() - 6);
  return sourceSessions.value.filter((session) => {
    const matchesText = !query || session.taskText.toLowerCase().includes(query);
    const matchesDuration = session.focusMinutes >= threshold;
    const matchesDate = dateRange.value === "all" || new Date(session.completedAt) >= start;
    return matchesText && matchesDuration && matchesDate;
  });
});

function resetFilters(): void {
  keyword.value = "";
  dateRange.value = "all";
  minimumMinutes.value = "0";
}

function projectName(taskId: string | null): string {
  const task = app.tasks.find((item) => item.id === taskId);
  const project = app.projects.find((item) => item.id === task?.projectId);
  return project?.name || "个人任务";
}

function characterName(characterId: string): string {
  return app.charactersDef.find((item) => item.characterId === characterId)?.characterName || "陪伴角色";
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
</script>
