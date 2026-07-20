<template>
  <div
    ref="viewport"
    class="virtual-list"
    :style="{ height: `${height}px` }"
    data-virtual-list
    @scroll="onScroll"
  >
    <div class="virtual-list-spacer" :style="{ height: `${totalHeight}px` }">
      <div class="virtual-list-window" :style="{ transform: `translateY(${offsetY}px)` }">
        <div
          v-for="entry in visibleEntries"
          :key="getKey(entry.item, entry.index)"
          class="virtual-list-row"
          :style="{ height: `${itemHeight}px` }"
          data-virtual-row
        >
          <slot :item="entry.item" :index="entry.index" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";

const props = withDefaults(defineProps<{
  items: any[];
  itemHeight: number;
  height: number;
  overscan?: number;
  itemKey?: string;
}>(), {
  overscan: 6,
  itemKey: "id",
});

const viewport = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const totalHeight = computed(() => props.items.length * props.itemHeight);
const visibleCount = computed(() => Math.ceil(props.height / props.itemHeight));
const startIndex = computed(() => Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.overscan));
const endIndex = computed(() => Math.min(props.items.length, startIndex.value + visibleCount.value + props.overscan * 2));
const offsetY = computed(() => startIndex.value * props.itemHeight);
const visibleEntries = computed(() => props.items.slice(startIndex.value, endIndex.value).map((item, offset) => ({
  item,
  index: startIndex.value + offset,
})));

watch(() => props.items, async () => {
  scrollTop.value = 0;
  await nextTick();
  if (viewport.value) viewport.value.scrollTop = 0;
});

function onScroll(event: Event): void {
  scrollTop.value = (event.currentTarget as HTMLElement).scrollTop;
}

function getKey(item: any, index: number): string | number {
  return item?.[props.itemKey] ?? index;
}
</script>
