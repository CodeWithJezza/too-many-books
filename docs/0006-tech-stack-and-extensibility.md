# Vite + React + TypeScript, Dexie over IndexedDB, structured for extension

The app is built with Vite, React, and TypeScript, using Dexie as the wrapper over IndexedDB (ADR 0001), a PWA plugin for installation and offline use, and Vitest for tests. The import, matching, and de-dupe logic is developed test-first against real Libby JSON and Goodreads CSV fixtures. A small charting library serves the stats screens; the exact choice is left to the build, provided it works well on touch screens.

The reader's requirement is that adding features later stays easy, so three seams are kept deliberate: import sources (Libby JSON, Goodreads CSV) and Metadata providers (Open Library first, Hardcover later, per ADR 0004) are each behind an interface so a new one is added without touching the rest; and all reads and writes go through a storage layer rather than calling Dexie directly from screens, so a synced backend could replace it if the app is later shared (see docs/open-questions.md).
