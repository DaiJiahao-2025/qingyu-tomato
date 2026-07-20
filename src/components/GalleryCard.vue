<template>
  <article
    class="gallery-card"
    :class="locked ? 'gallery-card-locked' : 'gallery-card-unlocked'"
    :aria-label="locked ? '未解锁回忆' : undefined"
  >
    <template v-if="locked">
      <div class="gallery-card-topline">
        <span>第 {{ index + 1 }} 段回忆</span>
        <span class="gallery-lock-mark">未解锁</span>
      </div>
      <div class="gallery-memory-seal" aria-hidden="true">?</div>
      <h2>新的回忆正在等你</h2>
      <p>完成第 {{ episode.requiredPomodoros }} 个番茄后，这一页会慢慢亮起来。</p>
    </template>
    <template v-else>
      <div class="gallery-card-topline">
        <span>第 {{ index + 1 }} 段回忆</span>
        <time>{{ formatDate(item!.unlockedAt) }}</time>
      </div>
      <h2>{{ item!.title }}</h2>
      <p>{{ item!.unlockText }}</p>
      <p v-if="item!.taskText"><strong>本轮任务：</strong>{{ item!.taskText }}</p>
      <button
        class="soft-action"
        type="button"
        :data-replay="episode.episodeId"
        @click="onReplay"
      >
        回放文字语音
      </button>
    </template>
  </article>
</template>

<script setup lang="ts">
import type { EpisodeHydrated, GalleryEntry } from "@/types";

const props = defineProps<{
  episode: EpisodeHydrated;
  index: number;
  item: GalleryEntry | null;
}>();

const emit = defineEmits<{
  replay: [episodeId: string];
}>();

const locked = props.item === null;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function onReplay() {
  if (props.item) {
    emit("replay", props.episode.episodeId);
  }
}
</script>
