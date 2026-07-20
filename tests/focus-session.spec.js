const { test, expect } = require("@playwright/test");

test("completed focus session updates task progress and focus history", async ({ page }) => {
  await page.addInitScript(() => {
    const now = Date.now();
    localStorage.setItem("fanqieqingyu:v1", JSON.stringify({
      currentCharacterId: "suisui_001",
      settings: { defaultFocusMinutes: 25, breakMinutes: 1, musicId: "rain_001", voiceVolume: 0.7, musicVolume: 0.25, muted: true },
      timerState: {
        status: "focusing",
        taskText: "完成数据闭环",
        taskId: "task_focus_test",
        focusMinutes: 25,
        startTime: now - 25 * 60 * 1000,
        endTime: now - 1000,
        pausedAt: null,
        totalPausedMs: 0,
        remainingAtPauseMs: null,
        episodeId: "suisui_ep_001",
      },
      tasks: [{
        id: "task_focus_test",
        workspaceId: "workspace_personal",
        title: "完成数据闭环",
        description: "",
        status: "doing",
        priority: "high",
        estimatedPomodoros: 2,
        completedPomodoros: 0,
        projectId: null,
        createdAt: new Date(now - 10000).toISOString(),
        completedAt: null,
      }],
    }));
    sessionStorage.setItem("fanqieqingyu:activeTimerSession", "1");
  });

  await page.goto("/");
  await expect(page.locator("#timerStateLabel")).toContainText("休息中", { timeout: 3000 });
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("fanqieqingyu:v1")));
  expect(state.focusSessions).toHaveLength(1);
  expect(state.focusSessions[0].taskId).toBe("task_focus_test");
  expect(state.tasks[0].completedPomodoros).toBe(1);
  expect(state.tasks[0].status).toBe("doing");
});
