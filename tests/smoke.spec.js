const { test, expect } = require("@playwright/test");

test("home page loads and enforces 25 minute minimum", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "添加番茄钟" })).toBeVisible();

  await page.getByRole("button", { name: "添加番茄钟" }).click();
  await page.locator("#focusMinutesInput").fill("10");
  await page.getByRole("button", { name: "确认开始" }).click();
  await expect(page.locator("#startError")).toContainText("不能少于 25 分钟");
});

test("gallery uses role skill cards and opens role-specific galleries", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-view="characters"]')).toHaveCount(0);
  await expect(page.locator('[data-character-gallery="suisui_001"]')).toBeHidden();

  await page.locator('.nav-button[data-view-target="gallery"]').click();
  await expect(page.locator('[data-view="gallery"]')).toHaveClass(/is-visible/);
  await expect(page.locator("#characterCardRow")).toBeVisible();
  await expect(page.locator("[data-character-gallery]")).toHaveCount(2);
  await expect(page.locator('[data-character-gallery="suisui_001"]')).toBeVisible();
  await expect(page.locator('[data-character-gallery="yaya_001"]')).toBeVisible();
  await expect(page.locator("#galleryCharacterName")).toBeHidden();
  await expect(page.locator("#voicePreviewButton")).toBeHidden();
  await expect(page.locator("#galleryGrid")).toBeHidden();

  await page.locator('[data-character-gallery="yaya_001"]').click();
  await expect(page.locator("#galleryCharacterName")).toContainText("\u5a05\u5a05");
  await expect(page.locator("#voicePreviewButton")).toBeEnabled();
  await expect(page.locator(".gallery-empty")).toContainText("\u5a05\u5a05");

  await page.locator("#galleryBackButton").click();
  await expect(page.locator("#characterCardRow")).toBeVisible();
  await expect(page.locator("#galleryGrid")).toBeHidden();

  await page.locator('[data-character-gallery="suisui_001"]').click();
  await expect(page.locator("#galleryCharacterName")).toContainText("\u5c81\u5c81");
  await expect(page.locator("#voicePreviewButton")).toBeEnabled();
  await expect(page.locator(".gallery-card")).toHaveCount(10);
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

test("pomodoro unlocks story and continues without choices", async ({ page }) => {
  await page.addInitScript(() => {
    const now = Date.now();
    const state = {
      currentCharacterId: "suisui_001",
      settings: {
        defaultFocusMinutes: 25,
        breakMinutes: 1,
        musicId: "rain_001",
        voiceVolume: 0.7,
        musicVolume: 0.25,
        muted: true,
      },
      timerState: {
        status: "focusing",
        taskText: "study",
        focusMinutes: 27,
        startTime: now - 27 * 60 * 1000,
        endTime: now - 1000,
        pausedAt: null,
        totalPausedMs: 0,
        remainingAtPauseMs: null,
        episodeId: "suisui_ep_002",
      },
      characters: {
        suisui_001: {
          completedPomodoros: 1,
          storyProgress: 1,
          unlockedEpisodeIds: ["suisui_ep_001"],
          pendingChoiceEpisodeId: "suisui_ep_001",
          choiceRecords: [{ episodeId: "suisui_ep_001" }],
        },
      },
      gallery: [],
      taskHistory: [],
      today: {
        date: new Date().toISOString().slice(0, 10),
        completed: 0,
      },
    };
    window.localStorage.setItem("fanqieqingyu:v1", JSON.stringify(state));
    window.sessionStorage.setItem("fanqieqingyu:activeTimerSession", "1");
  });

  await page.goto("/");
  await expect(page.locator("#choiceModal")).toHaveCount(0);
  await expect(page.locator("#timerStateLabel")).toContainText("休息中", { timeout: 2500 });
  await expect(page.locator("#breakStoryPanel")).toBeVisible();
  await expect(page.locator("#breakStoryTitle")).toContainText("名字");
  await expect(page.locator("#breakStoryText")).toContainText("今天的纸条上写着");
  await expect(page.locator("#continueNextButton")).toBeHidden();
  await expect(page.locator("#finishSessionButton")).toBeHidden();
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(window.localStorage.getItem("fanqieqingyu:v1")).gallery[0].unlockText.includes("今天的纸条上写着"),
      ),
    )
    .toBe(true);

  await page.locator("#skipBreakButton").click();
  await expect(page.locator("#breakStoryPanel")).toBeHidden();
  await expect(page.locator("#continueNextButton")).toBeVisible();
  await expect(page.locator("#finishSessionButton")).toBeVisible();

  await page.locator("#continueNextButton").click();
  await expect(page.locator("#timerStateLabel")).toContainText("专注中");
  await expect(page.locator("#timeRemaining")).toHaveText(/27:00|26:59/);

  await page.locator("#exitButton").click();
  await expect(page.locator("#homeEmptyState")).toBeVisible();
  await expect(page.locator("#immersiveTimer")).toBeHidden();
});

test("last episode completes without choices", async ({ page }) => {
  await page.addInitScript(() => {
    const now = Date.now();
    const state = {
      currentCharacterId: "suisui_001",
      settings: {
        defaultFocusMinutes: 25,
        breakMinutes: 1,
        musicId: "rain_001",
        voiceVolume: 0.7,
        musicVolume: 0.25,
        muted: true,
      },
      timerState: {
        status: "focusing",
        taskText: "study",
        focusMinutes: 28,
        startTime: now - 28 * 60 * 1000,
        endTime: now - 1000,
        pausedAt: null,
        totalPausedMs: 0,
        remainingAtPauseMs: null,
        episodeId: "suisui_ep_010",
      },
      characters: {
        suisui_001: {
          completedPomodoros: 9,
          storyProgress: 9,
          unlockedEpisodeIds: [
            "suisui_ep_001",
            "suisui_ep_002",
            "suisui_ep_003",
            "suisui_ep_004",
            "suisui_ep_005",
            "suisui_ep_006",
            "suisui_ep_007",
            "suisui_ep_008",
            "suisui_ep_009",
          ],
          pendingChoiceEpisodeId: null,
          choiceRecords: [],
        },
      },
      gallery: [],
      taskHistory: [],
      today: {
        date: new Date().toISOString().slice(0, 10),
        completed: 0,
      },
    };
    window.localStorage.setItem("fanqieqingyu:v1", JSON.stringify(state));
    window.sessionStorage.setItem("fanqieqingyu:activeTimerSession", "1");
  });

  await page.goto("/");
  await expect(page.locator("#choiceModal")).toHaveCount(0);
  await expect(page.locator("#currentLine")).toContainText("这十天的‘监督费’", { timeout: 2500 });
  await expect(page.locator("#breakStoryPanel")).toBeVisible();
  await expect(page.locator("#breakStoryTitle")).toContainText("最后一张便签");
  await expect(page.locator("#breakStoryText")).toContainText("最后一页只有一行秀气的字");
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(window.localStorage.getItem("fanqieqingyu:v1")).gallery[0].unlockText.includes("最后一页只有一行秀气的字"),
      ),
    )
    .toBe(true);
  await expect(page.locator("#continueNextButton")).toBeHidden();
  await expect(page.locator("#timerStateLabel")).toContainText("休息中");
  await page.locator("#skipBreakButton").click();
  await expect(page.locator("#continueNextButton")).toBeVisible();

  await page.locator("#continueNextButton").click();
  await expect(page.locator("#timerStateLabel")).toContainText("专注中");
  await expect(page.locator("#timeRemaining")).toHaveText(/28:00|27:59/);
});

async function readTimerSeconds(page) {
  const text = await page.locator("#timeRemaining").innerText();
  const [minutes, seconds] = text.split(":").map(Number);
  return minutes * 60 + seconds;
}
