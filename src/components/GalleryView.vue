<template>
  <section
    class="view"
    :class="{ 'is-visible': store.activeView === 'gallery' }"
    data-view="gallery"
  >
    <!-- Character Chooser -->
    <section
      class="gallery-chooser"
      aria-label="选择角色进入画廊。"
      :hidden="store.galleryMode !== 'chooser'"
    >
      <div id="characterCardRow" class="skill-card-row" aria-label="角色画廊">
        <CharacterCard
          v-for="card in store.characterCardData"
          :key="card.characterId"
          :data="card"
          @select="store.selectCharacterGallery"
        />
      </div>
    </section>

    <!-- Gallery Detail -->
    <section
      class="gallery-detail"
      data-gallery-detail
      :hidden="store.galleryMode !== 'detail'"
    >
      <div class="gallery-character-bar">
        <button
          id="galleryBackButton"
          class="soft-action gallery-back-button"
          type="button"
          @click="store.showGalleryChooser()"
        >
          返回角色选择
        </button>
        <div>
          <p id="galleryCharacterKicker">{{ store.galleryKicker }}</p>
          <h2 id="galleryCharacterName">{{ store.galleryCharacterName }}</h2>
        </div>
        <button
          id="voicePreviewButton"
          class="soft-action"
          type="button"
          :disabled="!store.voicePreviewReady"
          @click="onVoicePreview"
        >
          {{ voicePreviewLabel }}
        </button>
      </div>
      <div class="page-title">
        <p>剧情画廊</p>
        <h1>已解锁的片段</h1>
      </div>
      <div id="galleryGrid" class="gallery-grid">
        <template v-if="!store.galleryCardData.length">
          <article class="gallery-empty">
            <h2>{{ store.currentCharacter.characterName }}的剧情还在准备中</h2>
            <p>角色已经加入画廊。等剧情和语音资源补上后，这里会显示她的专属回忆。</p>
          </article>
        </template>
        <GalleryCard
          v-for="card in store.galleryCardData"
          :key="card.episode.episodeId"
          :episode="card.episode"
          :index="card.index"
          :item="card.item"
          @replay="onReplay"
        />
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useAppStore } from "@/stores/app";
import CharacterCard from "./CharacterCard.vue";
import GalleryCard from "./GalleryCard.vue";
import { playVoice, speakLine } from "@/composables/useAudio";

const store = useAppStore();

const voicePreviewLabel = computed(() => {
  const ch = store.currentCharacter;
  return store.voicePreviewReady ? `试听${ch.characterName}语音` : "语音准备中";
});

function onVoicePreview() {
  const result = store.previewVoice();
  if (!result) return;
  const { phase, episode, line } = result;
  const { muted, voiceVolume } = store.settings;
  const source = phase === "start" ? episode.startVoice : episode.endVoice;
  playVoice(source, voiceVolume, muted, () => speakLine(line, voiceVolume));
}

function onReplay(episodeId: string) {
  const result = store.replayVoice(episodeId);
  if (!result) return;
  const { episode, line } = result;
  const { muted, voiceVolume } = store.settings;
  const source = episode.endVoice;
  playVoice(source, voiceVolume, muted, () => speakLine(line, voiceVolume));
}
</script>
