const { test, expect } = require("@playwright/test");

test("Element Plus settings controls update persisted preferences", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-view-target="settings"]').click();
  await expect(page.locator('[data-view="settings"]')).toBeVisible();

  await expect(page.locator(".settings-panel .el-input-number")).toHaveCount(2);
  await expect(page.locator(".settings-panel .el-slider")).toHaveCount(2);
  const muteSwitch = page.locator(".settings-switch-row .el-switch");
  await expect(muteSwitch).toBeVisible();
  await muteSwitch.click();

  await expect.poll(() => page.evaluate(() =>
    JSON.parse(localStorage.getItem("fanqieqingyu:v1")).settings.muted,
  )).toBe(true);

  const themeColor = await page.evaluate(() =>
    getComputedStyle(document.body).getPropertyValue("--el-color-primary").trim(),
  );
  expect(themeColor).toBe("#ee8d82");
});
