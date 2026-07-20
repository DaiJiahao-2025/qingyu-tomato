const { test, expect } = require("@playwright/test");

async function openTaskWorkspace(page) {
  await page.goto("/");
  await page.locator('[data-view-target="tasks"]').click();
  await expect(page.locator('[data-view="tasks"]')).toBeVisible();
}

test("task workspace has no horizontal overflow on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openTaskWorkspace(page);
  await expect(page.locator(".workspace-header")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/tasks-desktop.png", fullPage: true });
});

test("task workspace has no horizontal overflow on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTaskWorkspace(page);
  await expect(page.locator(".nav-tabs")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/tasks-mobile.png", fullPage: true });
});
