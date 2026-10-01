# Reading Tracker — Build Brief

A personal, local-first reading tracker (Goodreads-style), built as an installable PWA for iPad. This brief indexes the design decisions made in `CONTEXT.md` and the numbered ADRs in `docs/`, and records the remaining details (screens, charts, matching rules) that weren't big enough for their own ADR but still constrain the build. Visual design is handled separately (Claude's design skill); this brief covers structure and behavior only.

Read `CONTEXT.md` first — it defines every term used below and in the ADRs. Then read the ADRs in order; each is a decision with its reasoning, not just a conclusion.

## Decision log (ADRs)

1. [Local-first PWA](0001-local-first-pwa.md) — no backend, persistent on-device storage (IndexedDB), iPad is the primary v1 device, backup/restore instead of sync.
2. [Libby import](0002-libby-json-borrowed-only-import.md) — JSON only, `Borrowed` rows only, identity = library key + titleId + timestamp (imported Loans only; the reader can also record a Loan by hand).
3. [Goodreads re-import](0003-reimport-updates-and-local-edits-win.md) — changed rows return to the Inbox as updates; local edits always win.
4. [Metadata provider](0004-metadata-provider-open-library-first.md) — Open Library is the primary provider, behind a swappable interface; AniList was added later for manga and light novel genres only.
5. [Backup/restore](0005-full-backup-includes-import-records-restore-replaces.md) — full JSON backup includes Import records; restore replaces, never merges.
6. [Tech stack](0006-tech-stack-and-extensibility.md) — Vite + React + TypeScript + Dexie + Vitest, built for extension.
7. [Add flow](0007-single-add-reading-form.md) — one form creates the Work and its first Reading/Shelf placement together.
8. [Stats counting rules and shared filters](0008-stats-counting-rules-and-shared-filters.md) — Stats counts Readings, and Stats and Library filter through one model.

## Core data model (see CONTEXT.md for full definitions)

- **Work** — the abstract book. Collects external IDs (Libby titleId, ISBN, Goodreads Book Id) for matching.
- **Reading** — one read-through: format, start/finish date (with precision), status (reading/finished/DNF), rating, review.
- **Series** — a name and position on a Work, fractional positions allowed. Works with the same series name make up a Series; there is no separate Series record. Suggested from a title such as "Name, Volume 3", never assigned without confirmation.
- **Shelf** — Currently reading & Read (automatic, derived from Readings), Want to read (manual), plus unlimited custom Shelves (manual).
- **Genre** — controlled list, per Work, multi-select, suggested from Metadata subjects.
- **Tag** — free-form, per Work, multi-select, autocompletes against existing tags. "light novel" and "manga" are offered as one-tap bubbles on Add and in the Inbox, suggested from the title or subjects and never assigned automatically.
- **Rating** — half-star steps, 0.5–5, optional (unrated ≠ low score).
- **Loan** — one borrow from a library: imported from Libby or entered by hand, date optional, optionally tied to the Reading it led to (`readingId`).
- **Import record** / **Inbox** — see Import matching rules below.
- **Metadata** / **Metadata provider** — Open Library lookups (plus AniList genre suggestions for manga and light novels), suggestions only, cached on device.
- **Merge** — permanent, no split; combines identifiers and history of two Works.
- **Add** — the single entry form (ADR 0007), which can also record a manual Loan.

## Import matching rules (Work identity across sources)

Three tiers, applied whenever a Loan, a Goodreads row, or a manual Add's title lookup needs to resolve to a Work:

1. **Exact, automatic** — a Libby titleId, ISBN, or Goodreads Book Id already stored on a Work.
2. **Fuzzy, suggested** — normalized title + author match with no shared ID → "Is this the same as *X*?", confirmed by the reader, never auto-merged. Confirming adds the new ID to the Work.
3. **No match** — creates a new Work.

This is the same logic whether the source is Libby, Goodreads, or a second Libby/Goodreads export later — it's what makes cross-source de-dupe and repeat imports work without special-casing each source (see ADR 0002, ADR 0003).

## Screens

Adaptive layout: bottom tab bar on phone-width, sidebar on iPad, with Library and a selected Work's page shown side by side on wider layouts.

- **Library** — every Work; search by title/author, sort by recently finished, title, author or rating. Filters (ADR 0008): Shelf tabs (All, Reading, Read, Want to read, DNF), Genre, Tag, Series, Rating (including Unrated), format, finish year and month (or date unknown), status, and missing-data filters (page count, genre, cover, finish date) that list the gaps to fill. Every filter beyond the Shelf tabs and sort shows as a removable chip. Views are small, medium or large cover grids and a detailed list, remembered per device. A letter index appears when sorted by title or author; title sort ignores a leading article, author sort uses the last name. Opens to a Work page (Readings, Metadata, Genres, Tags, Merge entry point).
- **Inbox** — grouped-by-Work import proposals. A Libby group can be resolved as Finished, DNF, Want to read, "Just link loans" (for a Work already in the library) or Dismiss; Finished and DNF Readings are dated to the newest borrow month and every Loan is kept. A Goodreads row returns as an update showing only the changed fields. A "Link N clean matches" button handles exact matches in one tap, and the tab badge shows the pending count. The Import buttons live here. "light novel" and "manga" bubbles on each row set a Tag, and choosing one lets the app ask AniList for genre suggestions.
- **Stats** — the charts below, filterable by year, genre, tag, series, rating and format; tapping a bar opens Library on the books behind it.
- **Settings** — backup and restore, CSV export, the online-lookup preference (automatic, when asked, or off), and Erase library. There is no Genre list editor; the Genre list is fixed in code.
- **Add** — the single form from ADR 0007, reachable from anywhere. A Loan can be recorded here and on a Work's Edit screen; imported Loans are never edited.

## Series page

A view inside Library, opened from the series name on a Work's page and shown in the same panel. Built:

- Every volume the library holds, in position order, marked Read, Reading now, DNF, Want to read or Not read, and each opens its Work.
- A summary of volumes read, counted up to the highest volume held. The app does not know a series' real length and never counts or shows a volume past that highest one.
- Whole-number volumes between 1 and the highest held that are not in the library show as gaps, not hidden. A gap's Add button opens the Add flow with the title and series filled in.
- "Show in Library" lists the Series' books through the Series filter.
- A description from Metadata is not built, so none is shown (no placeholder).

A manga and its light novel are different Series: the form marker in the name, such as "(Manga)" or "(Light Novel)", keeps them apart.

## Stats

Counting rules and the shared filter model are in ADR 0008; this is the list of what the screen shows. Stats filters by year and by Genre, Tag, Series, Rating and Format, and any chart that excludes Readings states how many it excluded. Tapping a bar, segment or ranked row selects it, a strip shows its label and count with an "Open in Library" button, and Library opens with the same facets as removable chips.

- Books per year (bar), with a "Date unknown" bar.
- Books per month, for a selected year (bar).
- Genre split (horizontal bar).
- Rating distribution (bar, half-star buckets), with unrated stated separately.
- Format split by year (ebook/audiobook/print).
- Top authors (ranked list).
- Library loans: loans per year, or per month once a year is picked; libraries ranked; borrowed Readings (finished Readings tied to a Loan versus no loan recorded); and borrowed, not finished. Loans narrow by Genre and Tag only; Rating and Format apply to the borrowed-Readings count.
- Compare years (shown once two years have data): two chosen years side by side for books per month, genres and formats. Each year keeps its own bar, side by side rather than overlaid; the second year is also hatched in the genre and format bars so colour is never the only cue. It ignores the year buttons, follows the filters, counts finished Readings under ADR 0008, and states Readings recorded only to the year. A tap selects a bar and opens its books in Library like any other chart.
- Series progress: for each series with more than one volume or a gap, one dot per volume (read, in library but not read, gap) and a count of volumes read out of volumes held plus gaps. It counts volumes (Works), not Readings, narrows by Genre, Tag and Series only, and a tap opens that Series in Library.
- Pages per year and per month, optional: hidden until "Show pages read" under "More charts" is ticked (remembered per device). Pages come from the Work's page count, so they are an estimate; audiobooks and books with no page count are left out and counted in a note.

DNF Readings are excluded from "books finished" counts and shown as their own separate count. Reading goals are not built (see `docs/open-questions.md`).

## Add flow summary (see ADR 0007 for full reasoning)

Title box (own library, then Open Library, then manual entry) → status selector (Reading now / Finished / DNF / Want to read) → status-dependent fields (format, start date, finish date + precision, rating, review) → save. Only title and status are required.

## Explicitly out of scope for v1

Tracked with reasoning in `docs/open-questions.md`:
- Reading goals (they conflict with the product principle of calm accounting, not pressure)
- Hardcover, Jikan and Google Books as Metadata providers (researched, not adopted: Jikan for its small request limit and the rate limiting of the MyAnimeList site it scrapes; AniList is used for manga and light novel genres only)
- A StoryGraph importer (deferred; see ADR 0006)
- Sync / backend / multi-device / sharing with other people
- A series' true length and description (no catalog supplies them reliably yet)
- A more robust (likely paid) ISBN/series catalog — needed only if this becomes a commercial product

## Verify early in the build

- Whether Open Library's API can be called directly from a browser (CORS) with no backend proxy (ADR 0004).
- Actual iOS/Safari persistent-storage behavior for a home-screen-installed PWA (ADR 0001).
