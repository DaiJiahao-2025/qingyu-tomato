const { test, expect } = require("@playwright/test");

test("migrates legacy task history into focus sessions", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("fanqieqingyu:v1", JSON.stringify({
      currentCharacterId: "suisui_001",
      taskHistory: [{ taskText: "旧版专注记录", completedAt: "2026-07-17T08:00:00.000Z", focusMinutes: 25 }],
    }));
  });

  await page.goto("/");
  await page.locator('[data-view-target="settings"]').click();
  await expect(page.locator("#taskHistory")).toContainText("旧版专注记录");

  const migrated = await page.evaluate(() => JSON.parse(localStorage.getItem("fanqieqingyu:v1")));
  expect(migrated.focusSessions).toHaveLength(1);
  expect(migrated.focusSessions[0].taskText).toBe("旧版专注记录");
});
