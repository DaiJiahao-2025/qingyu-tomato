<template>
  <ElForm class="task-form" label-position="top" @submit.prevent="submit">
    <BaseInput
      id="taskTitleInput"
      v-model="title"
      label="任务名称"
      description="写清楚这次要完成的结果"
      :error="error"
      required
      maxlength="40"
      placeholder="例如：完成项目首页交互"
    />
    <BaseInput
      id="taskDescriptionInput"
      v-model="description"
      label="任务说明"
      maxlength="120"
      placeholder="补充验收条件或上下文"
    />
    <div class="task-form-grid">
      <BaseSelect id="taskPrioritySelect" v-model="priority" label="优先级" :options="priorityOptions" />
      <BaseInput
        id="taskEstimateInput"
        v-model="estimatedPomodoros"
        label="预计番茄数"
        type="number"
        :min="1"
        :max="20"
      />
      <BaseSelect id="taskProjectSelect" v-model="projectId" label="所属项目" :options="projectOptions" />
    </div>
    <div class="task-form-actions">
      <ElButton type="primary" native-type="submit">{{ task ? '保存任务' : '创建任务' }}</ElButton>
      <ElButton v-if="task" plain @click="$emit('cancel')">取消编辑</ElButton>
    </div>
  </ElForm>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ElButton from "element-plus/es/components/button/index.mjs";
import ElForm from "element-plus/es/components/form/index.mjs";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/form/style/css";
import BaseInput from "@/components/ui/BaseInput.vue";
import BaseSelect from "@/components/ui/BaseSelect.vue";
import type { Project, Task, TaskPriority } from "@/types";

const props = defineProps<{ task?: Task | null; projects: Project[] }>();
const emit = defineEmits<{
  submit: [value: { title: string; description: string; priority: TaskPriority; estimatedPomodoros: number; projectId: string | null }];
  cancel: [];
}>();

const title = ref("");
const description = ref("");
const priority = ref<TaskPriority>("medium");
const estimatedPomodoros = ref(1);
const projectId = ref("");
const error = ref("");

const priorityOptions = [
  { label: "低", value: "low" },
  { label: "中", value: "medium" },
  { label: "高", value: "high" },
];
const projectOptions = computed(() => [
  { label: "未分组", value: "" },
  ...props.projects.map((project) => ({ label: project.name, value: project.id })),
]);

watch(() => props.task, (task) => {
  title.value = task?.title || "";
  description.value = task?.description || "";
  priority.value = task?.priority || "medium";
  estimatedPomodoros.value = task?.estimatedPomodoros || 1;
  projectId.value = task?.projectId || "";
  error.value = "";
}, { immediate: true });

function submit(): void {
  const cleanTitle = title.value.trim();
  if (!cleanTitle) {
    error.value = "请填写任务名称。";
    return;
  }
  emit("submit", {
    title: cleanTitle,
    description: description.value.trim(),
    priority: priority.value,
    estimatedPomodoros: Math.max(1, Number(estimatedPomodoros.value) || 1),
    projectId: projectId.value || null,
  });
  if (!props.task) {
    title.value = "";
    description.value = "";
    estimatedPomodoros.value = 1;
    error.value = "";
  }
}
</script>
