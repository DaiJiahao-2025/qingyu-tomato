# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

番茄轻语 (Fanqie Qingyu) is a focus-driven personal productivity web app that connects task management, a pomodoro timer, focus analytics, and story unlocks with virtual characters into one loop: create task → focus → record session → update task progress → view stats → unlock story. Built as a single-page application with Vite + Vue 3 + TypeScript + Pinia + Element Plus + ECharts, plus an optional backend in `server/` (Express 5 + TypeScript + Prisma + MySQL, JWT auth) that powers accounts and multi-device cloud sync. Guest mode remains fully local: all data lives in localStorage, and the app never touches the network until the user logs in.

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (http://127.0.0.1:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run all tests (Playwright, auto-starts its own dev server on port 54321)
npm test

# Run tests with UI / headed
npm run test:ui
npm run test:headed
```

Backend (`server/`, optional — only needed for accounts/cloud sync):

```bash
cd server
npm install
cp .env.example .env      # DATABASE_URL / JWT_SECRET
npm run migrate:dev       # apply Prisma migrations (local MySQL)
npm run dev               # tsx watch, http://localhost:3000
npm run typecheck         # tsc --noEmit
npm test                  # Vitest + Supertest against fanqie_test DB (TEST_DATABASE_URL to override)
```

The frontend dev server proxies `/api` to `http://localhost:3000` (see `vite.config.js`). `tests/cloud-sync.spec.js` is the end-to-end sync test; it skips itself when the backend is not running.

Frontend typecheck: `npm run typecheck` (vue-tsc). `tsconfig.json` is strict mode.

## Architecture

### Entry Flow
`index.html` → `src/main.ts` (creates Vue app + Pinia, imports `styles.css` and `src/styles/element-theme.css`) → `src/App.vue`

There is no router. `App.vue` renders all views inside an app shell (`SideRail` + workspace); the active view is switched via `appStore.activeView` (`ViewName`: home/tasks/dashboard/gallery/settings). `DashboardView`, `TaskView`, and `SettingsView` are lazy-loaded with `defineAsyncComponent` (code splitting); ECharts loads with `DashboardView`.

### State Management (Pinia)
`src/stores/app.ts` (~800 lines) is the **central store** (setup syntax). It owns:
- All persisted state (settings, timerState, characters progress, gallery, workspaces, projects, tasks, focusSessions, today counter)
- The timer state machine and story/unlock logic
- Static catalogs: `musicCatalog` and `charactersDef`
- Runtime UI state (activeView, modals, toast, unlock ribbon) and a `tick` counter that time-based computeds (`remainingMs`, `timeDisplay`, `progressPct`) depend on

The domain stores are thin facades / derived layers over `useAppStore` — new feature code should enter through them:
- `stores/task.ts` — projects & tasks CRUD, search/status/priority filters
- `stores/focus.ts` — timer state and actions entry point
- `stores/story.ts` — characters, episodes, gallery entry point
- `stores/analytics.ts` — derived metrics (today/week minutes, completion rate, streak days, weekly trend, per-project minutes)
- `stores/settings.ts` — settings entry point
- `stores/workspace.ts` — current workspace + switching
- `stores/auth.ts` — cloud account state (JWT token + user persisted in localStorage `fanqieqingyu:auth:v1`); actions register/login/logout; wires `configureApi` and triggers `fullResync()` after login

### Services & Composables
- `src/services/persistence.ts` — storage keys, default state, load/save/clear, and legacy migration (old `taskHistory` entries are migrated into `focusSessions`; missing workspace/task/project fields get defaults)
- `src/services/api.ts` — fetch wrapper for the backend (`/api`); attaches JWT, triggers logout on 401 via `configureApi`
- `src/services/sync.ts` — cloud sync engine: shadow-snapshot diff → debounced batched push + incremental pull through `POST /api/sync`; per-row LWW (`updatedAt`), character progress merged by max/union; sync metadata lives in its own localStorage key `fanqieqingyu:sync:v1`; everything is a no-op while logged out. Hook points: `scheduleCloudSync()` at the end of `appStore.persist()`, merge via `appStore.applyServerChanges()`, `initSyncEngine()` in `App.vue` onMounted
- `src/composables/useAudio.ts` — pure audio functions (Web Audio + HTMLAudioElement + speechSynthesis fallback); takes params, never reads the store
- `src/composables/useTicker.ts` — 1s interval calling `store.doTick()`; detects timer expiry (`completePomodoro`/`finishBreak`); throttled persist every 5s while focusing/on break, plus persist on `visibilitychange` hidden
- `src/composables/usePreload.ts` — idle-time preloading of images and audio metadata

### Components
- Views: `HomeView` (with `ImmersiveTimer`, `CharacterCard`), `TaskView` (`TaskForm`, `TaskTable`), `DashboardView` (charts), `GalleryView` (`GalleryCard`), `SettingsView` (`FocusHistoryTable`)
- `components/ui/` — `BaseInput`/`BaseSelect` (controlled/uncontrolled wrappers around Element Plus), `FormField`, `FilterBar`, `DataTable`, and a custom `VirtualList` for large focus-history rendering
- `components/charts/` — `BaseChart` handles ECharts init/option updates/ResizeObserver/dispose; `echarts.ts` registers only needed modules; `WeeklyFocusChart` (bar), `ProjectTimeChart` (pie) receive data from `analyticsStore`
- Element Plus is imported per-component (on demand), not globally

### Data Flow
1. `public/data/stories.json` — episode metadata, dialogue lines, voice file IDs (fetched by `appStore.loadStoryEpisodes()`)
2. TaskView → `taskStore.createTask` / start task → `appStore.startTimer` → `appStore.completePomodoro` → appends to `focusSessions`, updates task pomodoro progress, feeds `analyticsStore`, advances story progress / unlocks gallery entries
3. localStorage — single snapshot persisted by `appStore.persist()`

### Asset Structure
- `public/data/stories.json` — story metadata, episodes, dialogue, voice IDs
- `public/images/characters/[name]/` — character portraits (`.webp`, some with Chinese filenames)
- `public/audio/voice/[name]/` — voice clips (`.wav`)
- `public/audio/music/` — background music (`.mp3`)
- Assets referenced via app paths: `/audio/...`, `/images/...`, `/data/stories.json`

### Styling
- `styles.css` — global styles at project root (imported by `src/main.ts`)
- `src/styles/design-system.css` — design tokens and component styles
- `src/styles/element-theme.css` — Element Plus theme overrides
- Design direction: warm colors, soft rounded corners, card-based layout, gentle companion aesthetic (see `UI_DESIGN_SPEC.md`)

## Key Constraints

### Timer Implementation
Timer uses real timestamps, not countdown intervals:
- Saves `startTime`, `endTime`, `pausedAt`, `totalPausedMs`, `remainingAtPauseMs` to localStorage
- Calculates remaining time from current timestamp vs `endTime`; a `tick` ref forces computed re-evaluation each second
- Survives page refresh, tab switching, and system sleep (`restoreActiveTimerIfNeeded` uses the sessionStorage flag + navigation type to decide whether to restore)
- State machine statuses: `idle → focusing ⇄ paused → story → break → completed` (story = post-completion dialogue phase)
- Minimum focus session: 25 minutes (enforced in `StartModal.vue` and `SettingsView.vue`)
- Always preserve timestamp-based calculation logic to keep refresh recovery working

### TypeScript / Module Conventions
- `src/` is TypeScript (strict); the `@/` alias maps to `src/` and is defined in **both** `tsconfig.json` and `vite.config.js` — keep them in sync
- Config files (`vite.config.js`, `playwright.config.js`) remain CommonJS (`package.json` has `"type": "commonjs"`)

### Localization
- All user-facing text is in Chinese (UTF-8)
- Many filenames use Chinese characters (e.g., `public/images/characters/suisui/岁岁.webp`)
- Be careful when editing files from shells/editors that may display Chinese as mojibake

### Story Progression
- Each completed pomodoro advances the current character's `storyProgress` by 1
- Progress tracked per character in `characters[characterId]` (`completedPomodoros`, `storyProgress`, `unlockedEpisodeIds`)
- Gallery entries record timestamp, episode title, unlock text, task text, and support voice replay

### State Persistence
- Single localStorage key `"fanqieqingyu:v1"` holds the entire app state; active-session flag in sessionStorage key `"fanqieqingyu:activeTimerSession"`
- All persistence goes through `src/services/persistence.ts`; old saves are migrated on load, so schema changes must extend `mergeAppState` and stay backward compatible
- Guest mode has no account — clearing localStorage loses all progress (user warned in settings). When logged in, `clearAllData()` also resets the sync cursor so the next sync restores everything from the cloud (local clear ≠ cloud delete)

## Testing

Playwright tests in `tests/`: `smoke`, `test_audio`, `focus-session`, `persistence`, `layout`, `tasks`, `charts`, `element-plus`, `virtual-list`.

- Config: `playwright.config.js` — tests run against their own Vite server on **port 54321** (`reuseExistingServer: true`), 2 workers
- Browser: Chrome from `%LOCALAPPDATA%/ms-playwright/chrome-win64/`, overridable via `CHROME_PATH` env var (the `.browsers/` directory is a Linux-era leftover, no longer used by the config)
- Tests rely on `data-view` / `data-view-target` attributes, button labels, and element IDs — avoid renaming casually
- Performance scenario: open `http://127.0.0.1:5173/?perf=1` — `FocusHistoryTable.vue` then feeds 5000 generated sessions into `VirtualList` (only ~dozens of DOM nodes stay mounted)

## Code Style

See `AGENTS.md` for the detailed style guide and PR checklist. Key points:
- Business logic belongs in stores (central `app.ts` or the relevant domain store) and services; components stay presentational
- Audio/preload composables are pure functions — pass params in, don't read stores from them
- Preserve UTF-8 Chinese text and filenames
- Public assets referenced by app paths (`/audio/...`), not relative paths
- Don't commit generated output (`dist/`, `test-results/`)

## Common Tasks

**Add a new story episode:**
1. Edit `public/data/stories.json` — add an episode object to the `episodes` array (and its voice entries under `assets.voices`)
2. Add voice files to `public/audio/voice/[character]/`
3. Set `requiredPomodoros` for the unlock threshold

**Add background music:**
1. Add `.mp3` file to `public/audio/music/`
2. Update `musicCatalog` in `src/stores/app.ts`

**Add a new character:**
1. Add a `CharacterDef` to `charactersDef` in `src/stores/app.ts`
2. Add default progress in `defaultCharacterProgress()` in `src/services/persistence.ts`
3. Add portrait images to `public/images/characters/[name]/` and voice files to `public/audio/voice/[name]/`
4. Add story episodes for the character in `stories.json`

**Modify timer behavior:**
- Timer actions live in `src/stores/app.ts`: `startTimer()`, `togglePause()`, `completePomodoro()`, `finishBreak()`, `skipBreak()`, `exitTimer()`; the ticking loop is `src/composables/useTicker.ts`
- Check `timerState.status` transitions against the state machine above

**Tasks / analytics / charts:**
- Task and project operations: `src/stores/task.ts`; derived metrics: `src/stores/analytics.ts`; chart rendering: `src/components/charts/`

## Documentation

- `docs/ARCHITECTURE.md` — store boundaries, data flow, UI/chart boundaries, persistence, SaaS roadmap
- `docs/performance/README.md` — Lighthouse performance reports (before/after optimization)
- `PRD.md` — product requirements document (business logic, user flows, MVP scope)
- `UI_DESIGN_SPEC.md` — design system and visual direction
- `FRONTEND_ANALYSIS.md` — historical code structure analysis (pre-Vue version)
- `AGENTS.md` — development guidelines and PR checklist
- `README.md` — quick start guide
