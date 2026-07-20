const { test, expect } = require("@playwright/test");

test("starting a pomodoro plays the character start voice asset", async ({ page }) => {
  await page.addInitScript(() => {
    window.__playedAudioSources = [];
    HTMLMediaElement.prototype.play = function play() {
      window.__playedAudioSources.push(this.src);
      return Promise.resolve();
    };
  });

  await page.goto("/");
  await page.getByRole("button", { name: "添加番茄钟" }).click();
  await page.locator("#focusMinutesInput").fill("25");
  await page.getByRole("button", { name: "确认开始" }).click();

  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__playedAudioSources.some((source) => source.includes("/audio/voice/suisui/start-001.wav")),
      ),
    )
    .toBe(true);

  await expect(page.locator("#timerStateLabel")).toContainText("专注中");
});

test("gallery voice preview plays the selected character sample", async ({ page }) => {
  await page.addInitScript(() => {
    window.__playedAudioSources = [];
    HTMLMediaElement.prototype.play = function play() {
      window.__playedAudioSources.push(this.src);
      return Promise.resolve();
    };
  });

  await page.goto("/");
  await page.locator('.nav-button[data-view-target="gallery"]').click();
  await page.locator('[data-character-gallery="suisui_001"]').click();
  await page.locator("#voicePreviewButton").click();

  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__playedAudioSources.some((source) => source.includes("/audio/voice/suisui/start-001.wav")),
      ),
    )
    .toBe(true);

  await page.locator("#galleryBackButton").click();
  await page.locator('[data-character-gallery="yaya_001"]').click();
  await expect(page.locator("#voicePreviewButton")).toBeEnabled();
  await page.locator("#voicePreviewButton").click();

  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__playedAudioSources.some((source) => source.includes("/audio/voice/yaya/start-001.wav")),
      ),
    )
    .toBe(true);
});
