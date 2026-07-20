<template>
  <FormField
    :for-id="selectId"
    :label="label"
    :description="description"
    :error="error"
    :required="required"
  >
    <ElSelect
      :id="selectId"
      :data-control-id="selectId"
      v-bind="$attrs"
      class="ui-select-element"
      :model-value="currentValue"
      :disabled="disabled"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      @update:model-value="onChange"
    >
      <ElOption v-for="option in options" :key="String(option.value)" :label="option.label" :value="option.value" />
    </ElSelect>
  </FormField>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";
import ElSelect, { ElOption } from "element-plus/es/components/select/index.mjs";
import "element-plus/es/components/option/style/css";
import "element-plus/es/components/select/style/css";
import FormField from "./FormField.vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  id?: string;
  label: string;
  description?: string;
  error?: string;
  modelValue?: string | number;
  defaultValue?: string | number;
  options: Array<{ label: string; value: string | number }>;
  disabled?: boolean;
  required?: boolean;
}>(), { defaultValue: "" });

const emit = defineEmits<{
  "update:modelValue": [value: string | number];
  change: [value: string | number];
}>();

const generatedId = useId();
const selectId = computed(() => props.id || `select-${generatedId}`);
const internalValue = ref<string | number>(props.defaultValue);
const isControlled = computed(() => props.modelValue !== undefined);
const currentValue = computed(() => isControlled.value ? props.modelValue! : internalValue.value);

watch(() => props.defaultValue, (value) => {
  if (!isControlled.value) internalValue.value = value;
});

function onChange(value: string | number): void {
  if (!isControlled.value) internalValue.value = value;
  emit("update:modelValue", value);
  emit("change", value);
}
</script>
