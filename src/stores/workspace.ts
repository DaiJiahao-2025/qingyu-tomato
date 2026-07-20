import { computed } from "vue";
import { defineStore } from "pinia";
import { useAppStore } from "@/stores/app";

export const useWorkspaceStore = defineStore("workspace", () => {
  const app = useAppStore();
  const currentWorkspace = computed(() =>
    app.workspaces.find((workspace) => workspace.id === app.currentWorkspaceId) || app.workspaces[0],
  );

  function selectWorkspace(id: string): void {
    if (!app.workspaces.some((workspace) => workspace.id === id)) return;
    app.currentWorkspaceId = id;
    app.persist();
  }

  return {
    workspaces: computed(() => app.workspaces),
    currentWorkspace,
    selectWorkspace,
  };
});
