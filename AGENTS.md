# AGENTS.md

## Project Shape

- This is a Vite + Vue 3 single page app for a Chinese pomodoro/story experience.
- Entry points: `index.html` -> `src/main.js` -> `src/App.vue`.
- Main app behavior lives in `src/composables/usePomodoroLegacy.js`: timer state, localStorage persistence, story unlocks, gallery rendering, and audio playback.
- Global styling is mostly in `styles.css`; design tokens/support styles are in `src/styles/design-system.css`.
- Static content and assets live under `public/`:
  - `public/data/stories.json` stores story/character/audio metadata.
  - `public/images/characters/...` stores character art.
  - `public/audio/...` stores music and voice files.
- Playwright tests live in `tests/`.

## Run

```bash
npm install
npm run dev
```

The dev server is configured for `http://127.0.0.1:5173`.

Useful scripts:

```bash
npm run build
npm run preview
```

## Test

```bash
npm test
```

This runs Playwright with Chromium from `.browsers/chrome-linux64/chrome` and starts the Vite dev server automatically. For debugging:

```bash
npm run test:headed
npm run test:ui
```

## Code Style

- Keep JavaScript plain and compatible with the current CommonJS config files (`vite.config.js`, `playwright.config.js`).
- Prefer small, local changes in `src/composables/usePomodoroLegacy.js`; it currently owns most state and DOM wiring.
- Preserve UTF-8 Chinese copy and asset filenames. Be careful when editing files from shells/editors that display Chinese text as mojibake.
- Public assets should be referenced by app paths like `/audio/...`, `/images/...`, and `/data/stories.json`.
- Do not rename IDs, `data-*` attributes, or accessible button labels casually; tests rely on them.
- Avoid committing generated output such as `dist/`, `test-results/`, and local browser/cache artifacts.

## PR Checklist

- Run `npm test` before opening a PR; run `npm run build` when changing app code, config, or assets.
- Include updated Playwright coverage when changing timer flow, gallery behavior, localStorage schema, or audio playback.
- Verify new assets exist under `public/` and that their paths match `stories.json` or `usePomodoroLegacy.js`.
- Mention any localStorage schema changes and whether old saved sessions remain compatible.
- Keep PRs scoped: separate visual polish, story/content edits, and timer/state logic when possible.
