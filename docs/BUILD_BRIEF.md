# Reading Tracker — Build Brief

A personal, local-first reading tracker (Goodreads-style), built as an installable PWA for iPad. This brief indexes the design decisions made in `CONTEXT.md` and `docs/adr/`, and records the remaining details (screens, charts, matching rules) that weren't big enough for their own ADR but still constrain the build. Visual design is handled separately (Claude's design skill); this brief covers structure and behavior only.

Read `CONTEXT.md` first — it defines every term used below and in the ADRs. Then read the ADRs in order; each is a decision with its reasoning, not just a conclusion.

## Decision log (ADRs)

1. [Local-first PWA](docs/adr/0001-local-first-pwa.md) — no backend, persistent on-device storage (IndexedDB), iPad is the primary v1 device, backup/restore instead of sync.
2. [Libby import](docs/adr/0002-libby-json-borrowed-only-import.md) — JSON only, `Borrowed` rows only, identity = library key + titleId + timestamp.
3. [Goodreads re-import](docs/adr/0003-reimport-updates-and-local-edits-win.md) — changed rows return to the Inbox as updates; local edits always win.
4. [Metadata provider](docs/adr/0004-metadata-provider-open-library-first.md) — Open Library only in v1, behind a swappable interface; Hardcover planned.
5. [Backup/restore](docs/adr/0005-full-backup-includes-import-records-restore-replaces.md) — full JSON backup includes Import records; restore replaces, never merges.
6. [Tech stack](docs/adr/0006-tech-stack-and-extensibility.md) — Vite + React + TypeScript + Dexie + Vitest, built for extension.
7. [Add flow](docs/adr/0007-single-add-reading-form.md) — one form creates the Work and its first Reading/Shelf placement together.

## Core data model (see CONTEXT.md for full definitions)

- **Work** — the abstract book. Collects external IDs (Libby titleId, ISBN, Goodreads Book Id) for matching.
- **Reading** — one read-through: format, start/finish date (with precision), status (reading/finished/DNF), rating, review.
- **Series** — ordered Works, fractional positions allowed, suggested not assigned.
- **Shelf** — Currently reading & Read (automatic, derived from Readings), Want to read (manual), plus unlimited custom Shelves (manual).
- **Genre** — controlled list, per Work, multi-select, suggested from Metadata subjects.
- **Tag** — free-form, per Work, multi-select, autocompletes against existing tags.
- **Rating** — half-star steps, 0.5–5, optional (unrated ≠ low score).
- **Loan** / **Import record** / **Inbox** — see Import matching rules below.
- **Metadata** / **Metadata provider** — Open Library lookups, suggestions only, cached on device.
- **Merge** — permanent, no split; combines identifiers and history of two Works.
- **Add** — the single entry form (ADR 0007).

## Import matching rules (Work identity across sources)

Three tiers, applied whenever a Loan, a Goodreads row, or a manual Add's title lookup needs to resolve to a Work:

1. **Exact, automatic** — a Libby titleId, ISBN, or Goodreads Book Id already stored on a Work.
2. **Fuzzy, suggested** — normalized title + author match with no shared ID → "Is this the same as *X*?", confirmed by the reader, never auto-merged. Confirming adds the new ID to the Work.
3. **No match** — creates a new Work.

This is the same logic whether the source is Libby, Goodreads, or a second Libby/Goodreads export later — it's what makes cross-source de-dupe and repeat imports work without special-casing each source (see ADR 0002, ADR 0003).

## Screens

Adaptive layout: bottom tab bar on phone-width, sidebar on iPad, with Library and a selected Work's page shown side by side on wider layouts.

- **Library** — every Work; search by title/author; filter/sort by Shelf, Genre, Tag, Series, Rating, format, year. Shelves and Series are views inside Library, not separate top-level screens. Opens to a Work page (Readings, Metadata, Genres, Tags, Merge entry point).
- **Inbox** — grouped-by-Work import proposals (finished / want to read / dismiss, or update-with-changed-fields for a previously-seen record), with an "Accept all" for clean matches and a tab badge showing the pending count.
- **Stats** — the charts below, filterable by year.
- **Settings** — run an import, backup/restore, manage the Genre list.
- **Add** — the single form from ADR 0007, reachable from anywhere.

## Series page

- Description from Metadata, if found; omitted entirely if not (no placeholder).
- Every volume the app knows about (from imports, manual adds, or Metadata), in order, marked read/unread.
- Gaps in the sequence are shown as gaps, not hidden — the app never invents a volume it hasn't seen.
- A gap can be filled directly from the Series page via the Add flow.

## Stats (v1 charts)

All filterable by year; any chart that excludes unknown-date Readings states how many it excluded.

- Books per year (bar), with a "Date unknown" bar.
- Books per month, for a selected year (bar).
- Genre split (horizontal bar).
- Rating distribution (bar, half-star buckets).
- Format split by year (ebook/audiobook/print).
- Top authors (ranked list).

DNF Readings are excluded from "books finished" counts and shown as their own separate count. Deferred: reading goals, series-completion chart, pages-per-year chart (see `docs/open-questions.md`).

## Add flow summary (see ADR 0007 for full reasoning)

Title box (own library, then Open Library, then manual entry) → status selector (Reading now / Finished / DNF / Want to read) → status-dependent fields (format, start date, finish date + precision, rating, review) → save. Only title and status are required.

## Explicitly out of scope for v1

Tracked with reasoning in `docs/open-questions.md`:
- Reading goals
- Series-completion and pages-per-year stats
- Hardcover as a second Metadata provider
- Sync / backend / multi-device / sharing with other people
- A more robust (likely paid) ISBN/series catalog — needed only if this becomes a commercial product

## Verify early in the build

- Whether Open Library's API can be called directly from a browser (CORS) with no backend proxy (ADR 0004).
- Actual iOS/Safari persistent-storage behavior for a home-screen-installed PWA (ADR 0001).
