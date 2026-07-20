<template>
  <section class="view" :class="{ 'is-visible': app.activeView === 'dashboard' }" data-view="dashboard">
    <header class="workspace-header dashboard-header">
      <div>
        <p class="workspace-kicker">效率概览</p>
        <h1>今天的专注，正在积累成进度</h1>
      </div>
      <button class="primary-action" type="button" @click="app.navigateTo('tasks')">打开任务中心</button>
    </header>

    <section class="metric-grid" aria-label="专注指标">
      <article class="metric-item">
        <span>今日专注</span><strong>{{ analytics.todaySessions.length }}</strong><small>次完成</small>
      </article>
      <article class="metric-item">
        <span>今日时长</span><strong>{{ analytics.todayMinutes }}</strong><small>分钟</small>
      </article>
      <article class="metric-item">
        <span>本周时长</span><strong>{{ analytics.weekMinutes }}</strong><small>分钟</small>
      </article>
      <article class="metric-item">
        <span>任务完成率</span><strong>{{ analytics.completionRate }}</strong><small>%</small>
      </article>
      <article class="metric-item">
        <span>连续专注</span><strong>{{ analytics.streakDays }}</strong><small>天</small>
      </article>
      <article class="metric-item">
        <span>剧情进度</span><strong>{{ app.characterProgress.storyProgress }}</strong><small>段回忆</small>
      </article>
    </section>

    <section class="chart-grid" aria-label="专注数据图表">
      <article class="chart-panel">
        <div class="chart-panel-heading">
          <div><p class="workspace-kicker">七天趋势</p><h2>每天投入多少时间</h2></div>
          <span>{{ analytics.weekMinutes }} 分钟</span>
        </div>
        <WeeklyFocusChart :data="analytics.weeklyTrend" />
      </article>
      <article class="chart-panel">
        <div class="chart-panel-heading">
          <div><p class="workspace-kicker">项目分布</p><h2>本周时间花在哪里</h2></div>
          <span>{{ analytics.projectDistribution.length }} 类</span>
        </div>
        <ProjectTimeChart :data="analytics.projectDistribution" />
      </article>
    </section>

    <section class="dashboard-band">
      <div class="dashboard-band-heading">
        <div><p class="workspace-kicker">下一步</p><h2>待推进任务</h2></div>
        <span>{{ taskStore.activeTasks.length }} 项</span>
      </div>
      <div v-if="taskStore.activeTasks.length" class="next-task-list">
        <article v-for="task in taskStore.activeTasks.slice(0, 4)" :key="task.id" class="next-task-row">
          <div><strong>{{ task.title }}</strong><span>{{ task.completedPomodoros }} / {{ task.estimatedPomodoros }} 个番茄</span></div>
          <button class="soft-action" type="button" @click="taskStore.startTask(task.id)">开始专注</button>
        </article>
      </div>
      <div v-else class="dashboard-empty">
        <p>还没有待推进任务。</p>
        <button class="soft-action" type="button" @click="app.navigateTo('tasks')">创建第一个任务</button>
      </div>
    </section>

  </section>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { useAppStore } from "@/stores/app";
import { useTaskStore } from "@/stores/task";
import { useAnalyticsStore } from "@/stores/analytics";

const WeeklyFocusChart = defineAsyncComponent(() => import("@/components/charts/WeeklyFocusChart.vue"));
const ProjectTimeChart = defineAsyncComponent(() => import("@/components/charts/ProjectTimeChart.vue"));

const app = useAppStore();
const taskStore = useTaskStore();
const analytics = useAnalyticsStore();
</script>
