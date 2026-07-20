# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

番茄轻语 (Fanqie Qingyu) is a story-driven pomodoro timer web application. Users complete 25+ minute focus sessions to unlock story content with virtual characters. Built with Vite + Vue 3 as a single-page application.

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

# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests in headed mode
npm run test:headed
```

## Architecture

### Entry Flow
`index.html` → `src/main.js` → `src/App.vue` → `src/composables/usePomodoroLegacy.js`

### Core State Management
All application logic lives in `src/composables/usePomodoroLegacy.js` (~1175 lines):
- Timer state machine (idle → focusing → paused → completed → break)
- localStorage persistence (key: `"fanqieqingyu:v1"`)
- Story progression and unlocking logic
- Gallery rendering (dynamically generates HTML)
- Audio playback (voice + background music)
- Uses real timestamps (`startTime`, `endTime`, `pausedAt`, `totalPausedMs`) to calculate remaining time, enabling page refresh recovery

### Data Flow
1. `public/data/stories.json` - Story content, character dialogue, voice file paths
2. `usePomodoroLegacy.js` - Fetches stories, manages state, renders UI
3. localStorage - Persists progress, settings, gallery, task history
4. `App.vue` - Minimal template with `data-view` attributes for view switching

### Asset Structure
- `public/data/stories.json` - Story metadata, episodes, dialogue, choices
- `public/images/characters/[name]/` - Character portraits (`.webp` files with Chinese names)
- `public/audio/voice/[name]/` - Voice clips (`.wav` files)
- `public/audio/music/` - Background music (`.mp3` files)
- Assets referenced via app paths: `/audio/...`, `/images/...`, `/data/stories.json`

### Styling
- `styles.css` - Global styles at project root (imported by `src/main.js`)
- `src/styles/design-system.css` - Design tokens and component styles
- Design direction: warm colors, soft rounded corners, card-based layout, gentle companion aesthetic (see `UI_DESIGN_SPEC.md`)

## Key Constraints

### Timer Implementation
Timer uses real timestamps, not countdown intervals:
- Saves `startTime`, `endTime`, `pausedAt`, `totalPausedMs` to localStorage
- Calculates remaining time from current timestamp vs `endTime`
- Survives page refresh, browser tab switching, and system sleep
- Minimum session: 25 minutes (enforced in UI)

### Localization
- All user-facing text is in Chinese (UTF-8)
- Many filenames use Chinese characters (e.g., `public/images/characters/suisui/岁岁.webp`)
- Be careful when editing files from shells/editors that may display Chinese as mojibake

### Story Progression
- Each completed pomodoro advances story progress by 1
- Progress tracked per character (`characters[characterId].storyProgress`)
- Unlocked episodes stored in `characters[characterId].unlockedEpisodeIds`
- Gallery entries include timestamp, episode title, text, user choices, voice playback

### State Persistence
- Single localStorage key holds entire app state
- Session timer tracked separately in `"fanqieqingyu:activeTimerSession"`
- No backend, no account system - all data is local
- Clearing localStorage loses all progress (user warned in settings)

## Testing

Playwright tests in `tests/` directory:
- Uses local Chromium from `.browsers/chrome-linux64/chrome`
- Config: `playwright.config.js` sets up `LD_LIBRARY_PATH` for local libs
- Tests auto-start dev server on port 5173
- Tests rely on `data-*` attributes, button labels, and element IDs - avoid renaming casually

## Code Style

See `AGENTS.md` for detailed style guide. Key points:
- Config files use CommonJS (`vite.config.js`, `playwright.config.js`)
- Keep JavaScript compatible with CommonJS environments
- Preserve UTF-8 Chinese text and filenames
- Public assets referenced by app paths (`/audio/...`), not relative paths
- `usePomodoroLegacy.js` is intentionally monolithic - prefer small, local changes there

## Common Tasks

**Add a new story episode:**
1. Edit `public/data/stories.json` - add episode object under `stories` array
2. Add voice files to `public/audio/voice/[character]/`
3. Update `requiredPomodoros` to set unlock threshold

**Add background music:**
1. Add `.mp3` file to `public/audio/music/`
2. Update `musicCatalog` array in `usePomodoroLegacy.js`

**Add a new character:**
1. Add character object to `characters` array in `usePomodoroLegacy.js`
2. Add portrait images to `public/images/characters/[name]/`
3. Add voice files to `public/audio/voice/[name]/`
4. Initialize character state in `defaultState.characters`
5. Add story episodes for character in `stories.json`

**Modify timer behavior:**
- All timer logic is in `usePomodoroLegacy.js`: `startTimer()`, `togglePause()`, `completePomodoro()`, `finishBreak()`, `startTicker()`
- State machine: check `timerState.status` transitions
- Always preserve timestamp-based calculation logic to ensure refresh recovery

## Documentation

- `PRD.md` - Product requirements document (detailed business logic, user flows, MVP scope)
- `UI_DESIGN_SPEC.md` - Design system and visual direction
- `FRONTEND_ANALYSIS.md` - Original code structure analysis (from pre-Vue version)
- `AGENTS.md` - Detailed development guidelines and PR checklist
- `README.md` - Quick start guide
