const { test, expect } = require("@playwright/test");

// 云同步端到端：注册上云 → 另一浏览器上下文登录同一账号 → 数据回流。
// 需要后端（server/，默认 http://localhost:3000）在运行，否则整组跳过。

test.beforeEach(async ({ request }) => {
  const up = await request
    .get("http://localhost:3000/api/health")
    .then((res) => res.ok())
    .catch(() => false);
  test.skip(!up, "后端未启动，跳过云同步 E2E（启动方式：cd server && npm run dev）");
});

async function openSettings(page) {
  await page.locator('[data-view-target="settings"]').click();
  await expect(page.locator('[data-view="settings"]')).toBeVisible();
}

async function registerAccount(page, email, password) {
  await openSettings(page);
  await page.locator("#openAuthButton").click();
  await page.getByRole("button", { name: "没有账号？去注册" }).click();
  await page.locator("#authEmailInput").fill(email);
  await page.locator("#authPasswordInput").fill(password);
  await page.getByRole("button", { name: "注册", exact: true }).click();
  await expect(page.locator("#logoutButton")).toBeVisible({ timeout: 15000 });
}

async function loginAccount(page, email, password) {
  await openSettings(page);
  await page.locator("#openAuthButton").click();
  await page.locator("#authEmailInput").fill(email);
  await page.locator("#authPasswordInput").fill(password);
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.locator("#logoutButton")).toBeVisible({ timeout: 15000 });
}

async function createTask(page, title) {
  await page.locator('[data-view-target="tasks"]').click();
  await expect(page.locator('[data-view="tasks"]')).toBeVisible();
  await page.getByRole("button", { name: "新建任务" }).click();
  await page.locator("#taskTitleInput").fill(title);
  await page.getByRole("button", { name: "创建任务" }).click();
  await expect(page.locator(".task-element-table")).toContainText(title);
}

test("游客数据注册后上云，另一设备登录可拉取", async ({ browser }) => {
  const email = `e2e_${Date.now()}@sync.test`;
  const password = "secret123";
  const taskTitle = `跨设备任务_${Date.now()}`;

  // 设备 A：游客创建任务 → 注册（本地数据全量上云）
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await pageA.goto("/");
  await createTask(pageA, taskTitle);
  await registerAccount(pageA, email, password);
  await openSettings(pageA);
  await pageA.locator("#manualSyncButton").click();
  await expect(pageA.locator(".account-status")).toHaveText("已同步", { timeout: 15000 });

  // 设备 B：全新环境登录同一账号 → 任务回流
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await pageB.goto("/");
  await loginAccount(pageB, email, password);
  await pageB.locator('[data-view-target="tasks"]').click();
  await expect(pageB.locator(".task-element-table")).toContainText(taskTitle, { timeout: 15000 });

  // 设备 B 修改设置 → 手动同步 → 设备 A 手动同步后拉到变更
  await openSettings(pageB);
  await pageB.locator("#defaultFocusInput").fill("45");
  await pageB.locator("#defaultFocusInput").blur();
  await pageB.locator("#manualSyncButton").click();
  await expect(pageB.locator(".account-status")).toHaveText("已同步", { timeout: 15000 });

  await openSettings(pageA);
  await pageA.locator("#manualSyncButton").click();
  await expect(pageA.locator(".account-status")).toHaveText("已同步", { timeout: 15000 });
  await expect(pageA.locator("#defaultFocusInput")).toHaveValue("45", { timeout: 15000 });

  // 退出登录后回到游客模式，数据保留本地
  await pageA.locator("#logoutButton").click();
  await expect(pageA.locator("#openAuthButton")).toBeVisible();
  await pageA.locator('[data-view-target="tasks"]').click();
  await expect(pageA.locator(".task-element-table")).toContainText(taskTitle);

  await contextA.close();
  await contextB.close();
});
