<template>
  <div class="chart-surface" :style="{ height: `${height}px` }">
    <div
      ref="container"
      class="chart-canvas"
      role="img"
      :aria-label="ariaLabel"
      :data-chart-ready="ready ? 'true' : 'false'"
    ></div>
    <div v-if="empty" class="chart-empty">{{ emptyText }}</div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { init, type EChartsCoreOption } from "./echarts";

const props = withDefaults(defineProps<{
  option: EChartsCoreOption;
  ariaLabel: string;
  height?: number;
  empty?: boolean;
  emptyText?: string;
}>(), {
  height: 280,
  empty: false,
  emptyText: "暂无专注数据",
});

const container = ref<HTMLDivElement | null>(null);
const ready = ref(false);
let chart: ReturnType<typeof init> | null = null;
let resizeObserver: ResizeObserver | null = null;

async function renderChart(): Promise<void> {
  await nextTick();
  if (!container.value) return;
  if (!chart) chart = init(container.value, undefined, { renderer: "canvas" });
  chart.setOption(props.option, { notMerge: true });
  ready.value = true;
}

onMounted(() => {
  renderChart();
  if (container.value && "ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => chart?.resize());
    resizeObserver.observe(container.value);
  }
});

watch(() => props.option, renderChart, { deep: true });

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  chart?.dispose();
  chart = null;
});
</script>
