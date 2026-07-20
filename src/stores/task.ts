import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useAppStore } from "@/stores/app";
import type { Project, Task, TaskPriority, TaskStatus } from "@/types";

export const useTaskStore = defineStore("tasks", () => {
  const app = useAppStore();
  const searchQuery = ref("");
  const statusFilter = ref<"all" | TaskStatus>("all");
  const priorityFilter = ref<"all" | TaskPriority>("all");

  const projects = computed(() => app.projects);
  const tasks = computed(() => app.tasks);
  const filteredTasks = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();
    return tasks.value.filter((task) => {
      const matchesQuery = !query || `${task.title} ${task.description}`.toLowerCase().includes(query);
      const matchesStatus = statusFilter.value === "all" || task.status === statusFilter.value;
      const matchesPriority = priorityFilter.value === "all" || task.priority === priorityFilter.value;
      return matchesQuery && matchesStatus && matchesPriority;
    });
  });

  const activeTasks = computed(() => tasks.value.filter((task) => task.status !== "done"));

  function createProject(name: string, color = "#d46c4b"): Project {
    const project: Project = {
      id: `project_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      workspaceId: app.currentWorkspaceId,
      name: name.trim() || "未命名项目",
      color,
      createdAt: new Date().toISOString(),
    };
    app.projects.unshift(project);
    app.persist();
    return project;
  }

  function createTask(input: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    estimatedPomodoros?: number;
    projectId?: string | null;
  }): Task | null {
    const title = input.title.trim();
    if (!title) return null;
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      workspaceId: app.currentWorkspaceId,
      title,
      description: input.description?.trim() || "",
      status: "todo",
      priority: input.priority || "medium",
      estimatedPomodoros: Math.max(1, input.estimatedPomodoros || 1),
      completedPomodoros: 0,
      projectId: input.projectId || null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    app.tasks.unshift(task);
    app.persist();
    return task;
  }

  function updateTask(id: string, patch: Partial<Task>): void {
    const task = app.tasks.find((item) => item.id === id);
    if (!task) return;
    Object.assign(task, patch);
    app.persist();
  }

  function toggleTask(id: string): void {
    const task = app.tasks.find((item) => item.id === id);
    if (!task) return;
    task.status = task.status === "done" ? "todo" : "done";
    task.completedAt = task.status === "done" ? new Date().toISOString() : null;
    app.persist();
  }

  function deleteTask(id: string): void {
    app.tasks.splice(
      0,
      app.tasks.length,
      ...app.tasks.filter((task) => task.id !== id),
    );
    app.persist();
  }

  function startTask(id: string): void {
    const task = app.tasks.find((item) => item.id === id);
    if (!task) return;
    if (task.status === "todo") task.status = "doing";
    app.persist();
    app.openStartModal(id);
  }

  function clearFilters(): void {
    searchQuery.value = "";
    statusFilter.value = "all";
    priorityFilter.value = "all";
  }

  return {
    projects,
    tasks,
    activeTasks,
    filteredTasks,
    searchQuery,
    statusFilter,
    priorityFilter,
    createProject,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
    startTask,
    clearFilters,
  };
});
