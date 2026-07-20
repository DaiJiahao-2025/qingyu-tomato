<template>
  <div class="project-chart-wrap" data-chart="project-time">
    <BaseChart
      :option="option"
      ariaLabel="本周项目专注时长环形图"
      :height="240"
      :empty="!data.length"
    />
    <div v-if="data.length" class="project-chart-legend" aria-label="项目图例">
      <span v-for="(item, index) in data" :key="item.name">
        <i :style="{ backgroundColor: colors[index % colors.length] }"></i>
        {{ item.name }} · {{ item.value }} 分钟
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { PieChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import BaseChart from "./BaseChart.vue";
import { use, type EChartsCoreOption } from "./echarts";

use([PieChart, CanvasRenderer]);

const props = defineProps<{ data: Array<{ name: string; value: number }> }>();
const colors = ["#ee8d82", "#6f9775", "#c78a45", "#71849b", "#bc8f7f"];

const option = computed<EChartsCoreOption>(() => ({
  animationDuration: 450,
  color: colors,
  series: [{
    type: "pie",
    radius: ["42%", "68%"],
    center: ["50%", "50%"],
    avoidLabelOverlap: true,
    label: { show: false },
    emphasis: { label: { show: true, fontSize: 14, fontWeight: 700 } },
    data: props.data,
  }],
}));
</script>
