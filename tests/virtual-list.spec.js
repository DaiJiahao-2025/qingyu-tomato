const { test, expect } = require("@playwright/test");

test("virtual list keeps rendered rows bounded with 5000 sessions", async ({ page }) => {
  await page.goto("/?perf=1");
  await page.locator('[data-view-target="settings"]').click();

  await expect(page.locator("[data-total-count]")).toHaveAttribute("data-total-count", "5000");
  const renderedRows = await page.locator("[data-virtual-row]").count();
  expect(renderedRows).toBeGreaterThan(5);
  expect(renderedRows).toBeLessThan(30);

  await page.locator("#historyKeywordInput").fill("性能测试任务 4999");
  await expect(page.locator("[data-total-count]")).toHaveAttribute("data-total-count", "1");
  await expect(page.locator("[data-virtual-row]")).toHaveCount(1);
});
