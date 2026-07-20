<template>
  <ElTable
    class="task-element-table"
    :data="tasks"
    row-key="id"
    empty-text="当前筛选下没有任务"
  >
    <ElTableColumn label="任务" min-width="250">
      <template #default="{ row }">
        <div class="task-title-cell">
          <strong>{{ row.title }}</strong>
          <small>{{ row.description || '暂无说明' }}</small>
        </div>
      </template>
    </ElTableColumn>
    <ElTableColumn label="优先级" width="100">
      <template #default="{ row }">
        <ElTag :type="priorityType[row.priority as TaskPriority]" effect="light">
          {{ priorityLabel[row.priority as TaskPriority] }}
        </ElTag>
      </template>
    </ElTableColumn>
    <ElTableColumn label="番茄进度" width="110">
      <template #default="{ row }">{{ row.completedPomodoros }} / {{ row.estimatedPomodoros }}</template>
    </ElTableColumn>
    <ElTableColumn label="状态" width="100">
      <template #default="{ row }">
        <ElTag :type="statusType[row.status as TaskStatus]" effect="plain">
          {{ statusLabel[row.status as TaskStatus] }}
        </ElTag>
      </template>
    </ElTableColumn>
    <ElTableColumn label="操作" width="238" fixed="right">
      <template #default="{ row }">
        <div class="table-actions" @click.stop>
          <ElButton link type="primary" :aria-label="`开始专注：${row.title}`" @click="onStart(row as unknown as Task)">专注</ElButton>
          <ElButton link :aria-label="`编辑任务：${row.title}`" @click="onEdit(row as unknown as Task)">编辑</ElButton>
          <ElButton link type="success" :aria-label="`${row.status === 'done' ? '恢复' : '完成'}任务：${row.title}`" @click="onToggle(row as unknown as Task)">
            {{ row.status === 'done' ? '恢复' : '完成' }}
          </ElButton>
          <ElPopconfirm title="确认删除这项任务？" confirm-button-text="删除" cancel-button-text="取消" @confirm="onRemove(row as unknown as Task)">
            <template #reference>
              <ElButton link type="danger" :aria-label="`删除任务：${row.title}`" @click.stop>删除</ElButton>
            </template>
          </ElPopconfirm>
        </div>
      </template>
    </ElTableColumn>
  </ElTable>
</template>

<script setup lang="ts">
import ElButton from "element-plus/es/components/button/index.mjs";
import ElPopconfirm from "element-plus/es/components/popconfirm/index.mjs";
import ElTable, { ElTableColumn } from "element-plus/es/components/table/index.mjs";
import ElTag from "element-plus/es/components/tag/index.mjs";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/popconfirm/style/css";
import "element-plus/es/components/table/style/css";
import "element-plus/es/components/tag/style/css";
import type { Task, TaskPriority, TaskStatus } from "@/types";

defineProps<{ tasks: Task[] }>();
const emit = defineEmits<{
  start: [id: string];
  edit: [task: Task];
  toggle: [id: string];
  delete: [id: string];
}>();

const priorityLabel: Record<TaskPriority, string> = { low: "低", medium: "中", high: "高" };
const priorityType: Record<TaskPriority, "info" | "warning" | "danger"> = {
  low: "info",
  medium: "warning",
  high: "danger",
};
const statusLabel: Record<TaskStatus, string> = { todo: "待开始", doing: "进行中", done: "已完成" };
const statusType: Record<TaskStatus, "info" | "primary" | "success"> = {
  todo: "info",
  doing: "primary",
  done: "success",
};

function onStart(row: Task): void {
  emit("start", row.id);
}

function onEdit(row: Task): void {
  emit("edit", row);
}

function onToggle(row: Task): void {
  emit("toggle", row.id);
}

function onRemove(row: Task): void {
  emit("delete", row.id);
}
</script>
