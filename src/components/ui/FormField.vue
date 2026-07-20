<template>
  <label class="ui-field" :for="forId">
    <span class="ui-field-label">
      {{ label }}
      <small v-if="required">必填</small>
    </span>
    <span v-if="description" :id="descriptionId" class="ui-field-description">{{ description }}</span>
    <slot />
    <span v-if="error" :id="errorId" class="ui-field-error" role="alert">{{ error }}</span>
  </label>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  forId: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
}>();

const descriptionId = computed(() => `${props.forId}-description`);
const errorId = computed(() => `${props.forId}-error`);
</script>
