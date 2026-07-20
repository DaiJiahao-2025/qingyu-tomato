<template>
  <section class="filter-bar" aria-label="筛选条件">
    <div class="filter-bar-fields"><slot /></div>
    <ElButton class="filter-reset" plain @click="$emit('reset')">重置筛选</ElButton>
  </section>
</template>

<script setup lang="ts">
import ElButton from "element-plus/es/components/button/index.mjs";
import "element-plus/es/components/button/style/css";

defineEmits<{ reset: [] }>();
</script>
