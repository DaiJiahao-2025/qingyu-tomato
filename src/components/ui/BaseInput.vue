<template>
  <FormField
    :for-id="inputId"
    :label="label"
    :description="description"
    :error="error"
    :required="required"
  >
    <ElInputNumber
      v-if="type === 'number'"
      :id="inputId"
      v-bind="$attrs"
      class="ui-input-number"
      :model-value="Number(currentValue)"
      :disabled="disabled"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      controls-position="right"
      @update:model-value="onValueUpdate"
      @change="onChange"
    />
    <ElInput
      v-else
      :id="inputId"
      v-bind="$attrs"
      class="ui-input-element"
      :type="type"
      :model-value="String(currentValue)"
      :disabled="disabled"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      clearable
      @update:model-value="onValueUpdate"
      @change="onChange"
    />
  </FormField>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import ElInput from "element-plus/es/components/input/index.mjs";
import ElInputNumber from "element-plus/es/components/input-number/index.mjs";
import "element-plus/es/components/input/style/css";
import "element-plus/es/components/input-number/style/css";
import FormField from "./FormField.vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  id?: string;
  label: string;
  description?: string;
  error?: string;
  modelValue?: string | number;
  defaultValue?: string | number;
  type?: string;
  disabled?: boolean;
  required?: boolean;
}>(), {
  type: "text",
  defaultValue: "",
});

const emit = defineEmits<{
  "update:modelValue": [value: string | number];
  change: [value: string | number];
}>();

const generatedId = useId();
const inputId = computed(() => props.id || `input-${generatedId}`);
const internalValue = ref<string | number>(props.defaultValue);
const isControlled = computed(() => props.modelValue !== undefined);
const currentValue = computed(() => isControlled.value ? props.modelValue! : internalValue.value);
const describedBy = computed(() => [
  props.description ? `${inputId.value}-description` : "",
  props.error ? `${inputId.value}-error` : "",
].filter(Boolean).join(" ") || undefined);

watch(() => props.defaultValue, (value) => {
  if (!isControlled.value) internalValue.value = value;
});

function onValueUpdate(value: string | number | undefined): void {
  const nextValue = value ?? "";
  if (!isControlled.value) internalValue.value = nextValue;
  emit("update:modelValue", nextValue);
}

function onChange(value: string | number | undefined): void {
  emit("change", value ?? "");
}
</script>
