const { test, expect } = require("@playwright/test");

test("home page loads and enforces 25 minute minimum", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "添加番茄钟" })).toBeVisible();

  await page.getByRole("button", { name: "添加番茄钟" }).click();
  await page.locator("#focusMinutesInput").fill("10");
  await page.getByRole("button", { name: "确认开始" }).click();
  await expect(page.locator("#startError")).toContainText("不能少于 25 分钟");
});

test("refresh keeps an active pomodoro countdown instead of restarting it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "添加番茄钟" }).click();
  await page.locator("#mutedToggle").check();
  await page.locator("#focusMinutesInput").fill("25");
  await page.getByRole("button", { name: "确认开始" }).click();
  await expect(page.locator("#timerStateLabel")).toContainText("专注中");

  await expect(page.locator("#timeRemaining")).not.toHaveText("25:00", { timeout: 3500 });
  const beforeReloadSeconds = await readTimerSeconds(page);

  await page.reload();
  await expect(page.locator("#timerStateLabel")).toContainText("专注中");
  const afterReloadSeconds = await readTimerSeconds(page);

  expect(afterReloadSeconds).toBeLessThan(25 * 60);
  expect(afterReloadSeconds).toBeLessThanOrEqual(beforeReloadSeconds);
});

async function readTimerSeconds(page) {
  const text = await page.locator("#timeRemaining").innerText();
  const [minutes, seconds] = text.split(":").map(Number);
  return minutes * 60 + seconds;
}
