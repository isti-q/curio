# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Expo version is pinned

This is an Expo SDK **54** project (`expo ~54.0.34`, React Native 0.81, React 19). Expo's APIs change between SDKs — read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing code against any Expo/React Native API.

## Commands

```bash
npm install        # install dependencies
npm start          # expo start (dev server + QR code)
npm run ios        # open in iOS simulator
npm run android    # open in Android emulator
npm run web        # run in browser (web target is enabled)
npm run lint       # expo lint (ESLint, eslint-config-expo flat config)
```

There is no test runner configured. `npm run reset-project` is the create-expo-app starter script that archives `app/` into `app-example/` — do not run it.

## Architecture

Curio is a "daily fact" mobile app built on **Expo Router** (file-based routing). New Architecture and the React Compiler are both enabled (`app.json` → `newArchEnabled`, `experiments.reactCompiler`), and routes are typed (`experiments.typedRoutes`).

- `app/_layout.tsx` — root Stack. Loads the Fraunces Google fonts and holds the splash screen until fonts resolve.
- `app/(tabs)/_layout.tsx` — bottom tab navigator: **Today** (`index`), **Archive**, **Favorites**.
- `app/(tabs)/index.tsx` — the only fully-built screen. Shows today's fact, a "study further" card that opens a Google search in the browser, and a heart toggle.
- `app/(tabs)/archive.tsx`, `app/(tabs)/favorites.tsx` — **stub screens** ("Coming soon"). The favorites persistence layer (`lib/favorites.ts`) already exists and is written to from the Today screen, but the Favorites screen does not yet read it. Wiring these up is the natural next work.

Data and logic live outside the screens:

- `data/facts.json` — the content. Array of `{ id, category, text, searchKeywords }`. `category` must be one of the `CategoryKey` values in `constants/theme.ts`.
- `lib/facts.ts` — typed `Fact` access. `getTodaysFact()` is **deterministic**: it indexes the facts array by whole days since the Unix epoch, so the fact changes once per UTC calendar day and is the same for everyone (no randomness, no backend).
- `lib/favorites.ts` — favorite fact ids persisted in `AsyncStorage` under `@curio/favorites`, newest-first. All getters swallow errors and return `[]`.
- `constants/theme.ts` — single source of truth for design tokens: `COLORS`, `FONTS`, `CATEGORIES` (label + color per `CategoryKey`), and the `withAlpha(hex, alpha)` helper. Use these tokens rather than hardcoding colors; the palette is a warm-paper / terracotta theme derived from `../curio-ui-flow.html`.

Imports use the `@/*` path alias (mapped to the project root in `tsconfig.json`), e.g. `@/lib/facts`, `@/constants/theme`. TypeScript is in `strict` mode.

## Design reference

The repo parent dir contains the visual spec: `../curio-ui-flow.html` (full HTML mockup) plus PNG screenshots of each tab (`../today-tab*.png`, `../archive-tab.png`, `../favorites-tab*.png`, `../splash-screen.png`, `../color-pallet.png`). Match these when building out screens.
