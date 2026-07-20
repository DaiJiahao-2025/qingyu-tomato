const { test, expect } = require("@playwright/test");

test("dashboard renders weekly and project charts with real focus data", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    const now = Date.now();
    const completedAt = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem("fanqieqingyu:v1", JSON.stringify({
      currentWorkspaceId: "workspace_personal",
      projects: [{
        id: "project_chart",
        workspaceId: "workspace_personal",
        name: "作品集重构",
        color: "#ee8d82",
        createdAt: completedAt,
      }],
      tasks: [{
        id: "task_chart",
        workspaceId: "workspace_personal",
        title: "完善数据图表",
        description: "",
        status: "done",
        priority: "high",
        estimatedPomodoros: 2,
        completedPomodoros: 2,
        projectId: "project_chart",
        createdAt: completedAt,
        completedAt,
      }],
      focusSessions: [
        {
          id: "focus_chart_1",
          workspaceId: "workspace_personal",
          userId: "local_user",
          taskId: "task_chart",
          characterId: "suisui_001",
          taskText: "完善数据图表",
          focusMinutes: 25,
          startedAt: completedAt,
          completedAt,
          status: "completed",
        },
        {
          id: "focus_chart_2",
          workspaceId: "workspace_personal",
          userId: "local_user",
          taskId: "task_chart",
          characterId: "suisui_001",
          taskText: "完善数据图表",
          focusMinutes: 25,
          startedAt: completedAt,
          completedAt,
          status: "completed",
        },
      ],
    }));
  });

  await page.goto("/");
  await page.locator('[data-view-target="dashboard"]').click();
  await expect(page.locator('[data-view="dashboard"]')).toBeVisible();
  await expect(page.locator('[data-chart="weekly-focus"] [data-chart-ready="true"]')).toBeVisible();
  await expect(page.locator('[data-chart="project-time"] [data-chart-ready="true"]')).toBeVisible();

  const canvasPayloads = await page.locator(".chart-canvas canvas").evaluateAll((canvases) =>
    canvases.map((canvas) => canvas.toDataURL("image/png").length),
  );
  expect(canvasPayloads).toHaveLength(2);
  expect(canvasPayloads.every((length) => length > 1000)).toBe(true);

  await page.screenshot({ path: "test-results/dashboard-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/dashboard-mobile.png", fullPage: true });
});
