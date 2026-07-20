<template>
  <div class="data-table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key" :style="{ width: column.width }">
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading"><td :colspan="columns.length">正在加载</td></tr>
        <tr v-else-if="!rows.length"><td :colspan="columns.length">{{ emptyText }}</td></tr>
        <template v-else>
          <tr
            v-for="row in rows"
            :key="String(row[rowKey])"
            tabindex="0"
            @click="$emit('rowClick', row)"
            @keydown.enter="$emit('rowClick', row)"
          >
            <td v-for="column in columns" :key="column.key" :data-label="column.label">
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
                {{ row[column.key] }}
              </slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  columns: Array<{ key: string; label: string; width?: string }>;
  rows: Array<Record<string, any>>;
  rowKey?: string;
  emptyText?: string;
  loading?: boolean;
}>(), {
  rowKey: "id",
  emptyText: "暂无数据",
});

defineEmits<{ rowClick: [row: Record<string, any>] }>();
</script>
