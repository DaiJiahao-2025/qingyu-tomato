<template>
  <div
    id="toast"
    class="toast"
    :class="{ 'is-visible': store.toastVisible }"
    role="status"
    aria-live="polite"
  >
    {{ store.toastMessage }}
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from "@/stores/app";
const store = useAppStore();
</script>
