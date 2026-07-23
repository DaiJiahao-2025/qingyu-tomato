# AGENTS.md

## Project Shape

- This is a Vite + Vue 3 + TypeScript single page app for a Chinese pomodoro/task/story experience.
- Entry points: `index.html` -> `src/main.ts` -> `src/App.vue`.
- State lives in Pinia stores under `src/stores/`: `app.ts` is the central store (persisted state, timer state machine, story unlocks); `task.ts`, `focus.ts`, `story.ts`, `analytics.ts`, `settings.ts`, `workspace.ts`, `auth.ts` are thin domain entry points on top of it.
- `src/services/persistence.ts` owns localStorage defaults, load/save, and legacy data migration.
- `src/composables/` holds pure helpers: `useAudio.ts` (voice/music playback), `useTicker.ts` (1s tick + throttled persist), `usePreload.ts` (idle preloading).
- UI is split into components under `src/components/` (views, `ui/` base controls wrapping Element Plus, `charts/` wrapping ECharts).
- Global styling is mostly in `styles.css`; design tokens are in `src/styles/design-system.css`; Element Plus overrides in `src/styles/element-theme.css`.
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

This runs Playwright with Chrome from `%LOCALAPPDATA%/ms-playwright/chrome-win64/` (override with the `CHROME_PATH` env var) and starts its own Vite server on port 54321 automatically. For debugging:

```bash
npm run test:headed
npm run test:ui
```

## Code Style

- `src/` is strict TypeScript; the `@/` alias maps to `src/` (defined in both `tsconfig.json` and `vite.config.js`).
- Keep config files (`vite.config.js`, `playwright.config.js`) CommonJS-compatible; `package.json` uses `"type": "commonjs"`.
- Put business logic in stores/services, keep components presentational; keep audio/preload composables pure (params in, no store reads).
- Preserve UTF-8 Chinese copy and asset filenames. Be careful when editing files from shells/editors that display Chinese text as mojibake.
- Public assets should be referenced by app paths like `/audio/...`, `/images/...`, and `/data/stories.json`.
- Do not rename IDs, `data-view`/`data-view-target` attributes, or accessible button labels casually; tests rely on them.
- Avoid committing generated output such as `dist/`, `test-results/`, and local browser/cache artifacts.

## PR Checklist

- Run `npm test` before opening a PR; run `npm run build` when changing app code, config, or assets.
- Include updated Playwright coverage when changing timer flow, task management, gallery behavior, localStorage schema, or audio playback.
- Verify new assets exist under `public/` and that their paths match `stories.json` or `src/stores/app.ts` (`musicCatalog`, `charactersDef`).
- localStorage schema changes must extend `mergeAppState` in `src/services/persistence.ts` so old saved sessions stay compatible; mention the migration in the PR.
- Keep PRs scoped: separate visual polish, story/content edits, and timer/state logic when possible.
