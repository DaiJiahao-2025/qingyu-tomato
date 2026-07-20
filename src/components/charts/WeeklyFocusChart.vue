<template>
  <BaseChart
    data-chart="weekly-focus"
    :option="option"
    ariaLabel="最近七天专注时长柱状图"
    :empty="!hasData"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { BarChart } from "echarts/charts";
import { GridComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import BaseChart from "./BaseChart.vue";
import { use, type EChartsCoreOption } from "./echarts";

use([BarChart, GridComponent, CanvasRenderer]);

const props = defineProps<{
  data: Array<{ date: string; label: string; minutes: number; sessions: number }>;
}>();

const hasData = computed(() => props.data.some((item) => item.minutes > 0));
const option = computed<EChartsCoreOption>(() => ({
  animationDuration: 450,
  grid: { left: 42, right: 16, top: 24, bottom: 34 },
  xAxis: {
    type: "category",
    data: props.data.map((item) => item.label),
    axisTick: { show: false },
    axisLine: { lineStyle: { color: "#ead7cf" } },
    axisLabel: { color: "#9a8178" },
  },
  yAxis: {
    type: "value",
    minInterval: 25,
    axisLabel: { color: "#9a8178" },
    splitLine: { lineStyle: { color: "#f0e2dc" } },
  },
  series: [{
    type: "bar",
    data: props.data.map((item) => item.minutes),
    barMaxWidth: 34,
    itemStyle: { color: "#ee8d82", borderRadius: [4, 4, 0, 0] },
  }],
}));
</script>
