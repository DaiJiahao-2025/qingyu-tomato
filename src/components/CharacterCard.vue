<template>
  <button
    class="skill-character-card"
    :class="{ 'is-selected': data.isSelected }"
    :data-character-gallery="data.characterId"
    type="button"
    :aria-current="data.isSelected ? 'true' : 'false'"
    :style="{
      '--mx': mx + '%',
      '--my': my + '%',
      '--rx': rx + 'deg',
      '--ry': ry + 'deg',
    }"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
    @click="$emit('select', data.characterId)"
  >
    <span class="skill-card-shine" aria-hidden="true"></span>
    <span class="skill-card-glare" aria-hidden="true"></span>
    <span class="skill-card-frame">
      <span class="skill-card-status">{{ data.galleryStatus }}</span>
      <span class="skill-card-portrait">
        <img
          :src="data.galleryPortrait || data.portrait"
          :alt="data.characterName + '立绘'"
          loading="lazy"
          decoding="async"
        />
      </span>
      <span class="skill-card-body">
        <span class="skill-card-type">{{ data.style }}</span>
        <strong>{{ data.characterName }}</strong>
        <span>{{ data.description }}</span>
      </span>
      <span class="skill-card-progress" :aria-label="data.progressLabel">
        <span :style="{ width: data.progressPct + '%' }"></span>
      </span>
      <span class="skill-card-foot">
        <span>{{ data.progressLabel }}</span>
        <span>进入画廊</span>
      </span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { ref } from "vue";

interface CardData {
  characterId: string;
  characterName: string;
  galleryStatus: string;
  portrait: string;
  galleryPortrait?: string;
  style: string;
  description: string;
  progressLabel: string;
  progressPct: number;
  isSelected: boolean;
}

defineProps<{
  data: CardData;
}>();

defineEmits<{
  select: [characterId: string];
}>();

const mx = ref(50);
const my = ref(42);
const rx = ref(0);
const ry = ref(0);

function onPointerMove(event: PointerEvent) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const card = (event.target as HTMLElement).closest("[data-character-gallery]");
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
  const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
  mx.value = x;
  my.value = y;
  rx.value = ((50 - y) / 50) * 5;
  ry.value = ((x - 50) / 50) * 6;
}

function onPointerLeave(event: PointerEvent) {
  if ((event.currentTarget as HTMLElement).matches(":hover")) return;
  mx.value = 50;
  my.value = 42;
  rx.value = 0;
  ry.value = 0;
}
</script>
