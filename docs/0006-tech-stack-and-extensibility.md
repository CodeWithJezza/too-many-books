# Vite + React + TypeScript, Dexie over IndexedDB, structured for extension

The app is built with Vite, React, and TypeScript, using Dexie as the wrapper over IndexedDB (ADR 0001), a PWA plugin for installation and offline use, and Vitest for tests. The import, matching, and de-dupe logic is developed test-first against real Libby JSON and Goodreads CSV fixtures. The stats screens use charts hand-built from CSS bars; no charting library was adopted.

The reader's requirement is that adding features later stays easy, so three seams are kept deliberate: import sources (Libby JSON, Goodreads CSV) and Metadata providers (Open Library first, AniList added for manga and light novels, per ADR 0004) are each behind an interface so a new one is added without touching the rest; and all reads and writes go through a storage layer rather than calling Dexie directly from screens, so a synced backend could replace it if the app is later shared (see docs/open-questions.md).

A third import source, such as a StoryGraph export, would be added as another parser feeding the Inbox, beside the Libby and Goodreads ones, without touching the rest of the app. The StoryGraph importer is deferred.
