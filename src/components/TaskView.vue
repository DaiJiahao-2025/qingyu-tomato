<template>
  <section class="view" :class="{ 'is-visible': app.activeView === 'tasks' }" data-view="tasks">
    <header class="workspace-header">
      <div>
        <p class="workspace-kicker">任务中心</p>
        <h1>把目标拆成下一次专注</h1>
      </div>
      <button class="primary-action" type="button" @click="formVisible = !formVisible">
        {{ formVisible ? '收起表单' : '新建任务' }}
      </button>
    </header>

    <section v-if="formVisible" class="workspace-section task-editor" aria-label="任务编辑">
      <TaskForm :task="editingTask" :projects="taskStore.projects" @submit="saveTask" @cancel="cancelEdit" />
    </section>

    <section class="workspace-section project-strip" aria-label="项目管理">
      <div>
        <p class="workspace-kicker">项目</p>
        <strong>{{ taskStore.projects.length ? `${taskStore.projects.length} 个项目` : '先创建一个项目来整理任务' }}</strong>
      </div>
      <div class="inline-create">
        <BaseInput
          :key="projectInputVersion"
          label="新项目名称"
          default-value=""
          maxlength="20"
          placeholder="项目名称"
          @update:model-value="projectName = String($event)"
        />
        <button class="soft-action" type="button" @click="createProject">添加项目</button>
      </div>
    </section>

    <FilterBar @reset="taskStore.clearFilters">
      <BaseInput id="taskSearchInput" v-model="taskStore.searchQuery" label="搜索" type="search" placeholder="任务名称或说明" />
      <BaseSelect id="taskStatusFilter" v-model="taskStore.statusFilter" label="状态" :options="statusOptions" />
      <BaseSelect id="taskPriorityFilter" v-model="taskStore.priorityFilter" label="优先级" :options="priorityOptions" />
    </FilterBar>

    <section class="workspace-section">
      <TaskTable
        :tasks="taskStore.filteredTasks"
        @start="taskStore.startTask"
        @edit="editTask"
        @toggle="taskStore.toggleTask"
        @delete="taskStore.deleteTask"
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAppStore } from "@/stores/app";
import { useTaskStore } from "@/stores/task";
import TaskForm from "@/components/TaskForm.vue";
import TaskTable from "@/components/TaskTable.vue";
import FilterBar from "@/components/ui/FilterBar.vue";
import BaseInput from "@/components/ui/BaseInput.vue";
import BaseSelect from "@/components/ui/BaseSelect.vue";
import type { Task } from "@/types";

const app = useAppStore();
const taskStore = useTaskStore();
const formVisible = ref(false);
const editingTask = ref<Task | null>(null);
const projectName = ref("");
const projectInputVersion = ref(0);
const statusOptions = [
  { label: "全部状态", value: "all" },
  { label: "待开始", value: "todo" },
  { label: "进行中", value: "doing" },
  { label: "已完成", value: "done" },
];
const priorityOptions = [
  { label: "全部优先级", value: "all" },
  { label: "高", value: "high" },
  { label: "中", value: "medium" },
  { label: "低", value: "low" },
];

function saveTask(value: Parameters<typeof taskStore.createTask>[0]): void {
  if (editingTask.value) {
    taskStore.updateTask(editingTask.value.id, value);
    cancelEdit();
    return;
  }
  taskStore.createTask(value);
}

function editTask(task: Task): void {
  editingTask.value = task;
  formVisible.value = true;
}

function cancelEdit(): void {
  editingTask.value = null;
  formVisible.value = false;
}

function createProject(): void {
  if (!projectName.value.trim()) return;
  taskStore.createProject(projectName.value);
  projectName.value = "";
  projectInputVersion.value += 1;
}
</script>
