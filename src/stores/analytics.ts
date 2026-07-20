import { computed } from "vue";
import { defineStore } from "pinia";
import { useAppStore } from "@/stores/app";
import { useTaskStore } from "@/stores/task";

export const useAnalyticsStore = defineStore("analytics", () => {
  const app = useAppStore();
  const taskStore = useTaskStore();

  const completedSessions = computed(() =>
    app.focusSessions.filter((session) => session.status === "completed"),
  );

  const todaySessions = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return completedSessions.value.filter((session) => session.completedAt.startsWith(today));
  });

  const weekSessions = computed(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    return completedSessions.value.filter((session) => new Date(session.completedAt) >= start);
  });

  const todayMinutes = computed(() => todaySessions.value.reduce((sum, item) => sum + item.focusMinutes, 0));
  const weekMinutes = computed(() => weekSessions.value.reduce((sum, item) => sum + item.focusMinutes, 0));
  const completionRate = computed(() => {
    if (!taskStore.tasks.length) return 0;
    return Math.round((taskStore.tasks.filter((task) => task.status === "done").length / taskStore.tasks.length) * 100);
  });
  const streakDays = computed(() => {
    const dates = new Set(completedSessions.value.map((session) => session.completedAt.slice(0, 10)));
    let streak = 0;
    const cursor = new Date();
    while (dates.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  });
  const projectMinutes = computed(() =>
    taskStore.projects.map((project) => ({
      ...project,
      minutes: weekSessions.value
        .filter((session) => {
          const task = taskStore.tasks.find((item) => item.id === session.taskId);
          return task?.projectId === project.id;
        })
        .reduce((sum, session) => sum + session.focusMinutes, 0),
    })),
  );

  const weeklyTrend = computed(() => {
    const totals = new Map<string, { minutes: number; sessions: number }>();
    weekSessions.value.forEach((session) => {
      const key = toLocalDateKey(new Date(session.completedAt));
      const current = totals.get(key) || { minutes: 0, sessions: 0 };
      current.minutes += session.focusMinutes;
      current.sessions += 1;
      totals.set(key, current);
    });

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      const value = totals.get(toLocalDateKey(date)) || { minutes: 0, sessions: 0 };
      return {
        date: toLocalDateKey(date),
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        minutes: value.minutes,
        sessions: value.sessions,
      };
    });
  });

  const projectDistribution = computed(() => {
    const totals = new Map<string, number>();
    weekSessions.value.forEach((session) => {
      const task = taskStore.tasks.find((item) => item.id === session.taskId);
      const project = taskStore.projects.find((item) => item.id === task?.projectId);
      const name = project?.name || "个人任务";
      totals.set(name, (totals.get(name) || 0) + session.focusMinutes);
    });
    return Array.from(totals, ([name, value]) => ({ name, value }));
  });

  return {
    completedSessions,
    todaySessions,
    weekSessions,
    todayMinutes,
    weekMinutes,
    completionRate,
    streakDays,
    projectMinutes,
    weeklyTrend,
    projectDistribution,
  };
});

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
