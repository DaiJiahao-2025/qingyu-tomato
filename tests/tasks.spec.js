const { test, expect } = require("@playwright/test");

test("creates a task and starts a focus session from it", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-view-target="tasks"]').click();
  await expect(page.locator('[data-view="tasks"]')).toBeVisible();

  await page.getByLabel("新项目名称").fill("作品集重构");
  await page.getByRole("button", { name: "添加项目" }).click();
  await expect(page.locator(".project-strip")).toContainText("1 个项目");

  await page.getByRole("button", { name: "新建任务" }).click();
  await page.locator("#taskTitleInput").fill("完成 SaaS 任务中心");
  await page.locator("#taskEstimateInput").fill("3");
  await page.locator('[data-control-id="taskPrioritySelect"]').click();
  await page.getByRole("option", { name: "高", exact: true }).click();
  await page.locator('[data-control-id="taskProjectSelect"]').click();
  await page.getByRole("option", { name: "作品集重构", exact: true }).click();
  await page.getByRole("button", { name: "创建任务" }).click();

  await expect(page.locator(".task-element-table")).toContainText("完成 SaaS 任务中心");
  await expect(page.locator(".task-element-table")).toContainText("0 / 3");

  await page.mouse.move(0, 0);
  // 按钮有 background-color transition，轮询等待过渡结束后的最终主题色
  await expect
    .poll(async () =>
      page.getByRole("button", { name: "创建任务" }).evaluate((element) =>
        getComputedStyle(element).backgroundColor,
      ),
    )
    .toBe("rgb(238, 141, 130)");

  await page.getByRole("button", { name: "开始专注：完成 SaaS 任务中心" }).click();
  await expect(page.locator("#startModal")).toBeVisible();
  await expect(page.locator("#taskInput")).toHaveValue("完成 SaaS 任务中心");
});
