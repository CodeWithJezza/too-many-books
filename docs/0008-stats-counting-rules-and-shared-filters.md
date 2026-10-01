# Stats count Readings by stated rules, and share one filter model with Library

Every Stats chart follows the same counting rules, and Stats and Library filter through one model, so a number on a chart can always be checked by opening the books behind it.

**Counting unit.** Stats counts Readings, not Works: a re-read counts again in the period it finished. Loans are counted as Loans, never as Readings. A Reading is "borrowed" only when a Loan is tied to it (its `readingId`); a Reading with no Loan has "no loan recorded", which is not the same as owned. The Library lists Works, so a drill-through can show fewer books than a chart counted when a Work was read more than once.

**DNF.** DNF Readings are left out of finished counts and shown as their own count. Nothing about a DNF (pages, length) is added to finished totals.

**Date precision.** A chart includes a Reading when its Finish date is at least as precise as the chart's unit: month charts need month or day precision, year charts need year or better. Unknown dates are never guessed from another field.

**Excluded counts.** Any chart that drops Readings (unknown date, unknown length, year-only in a month chart) says how many, and the note opens those books.

**Filters.** One filter model serves both screens. Work-level facets (Genre, Tag, Series) describe the book. Reading-level facets (Rating, Format, Finish year and month, status) describe a read-through. A Work matches a Library filter when at least one of its Readings satisfies every Reading-level facet together, so "audiobook, rated 5" never matches an ebook rated 5 plus an unrelated audiobook. Stats applies the same facets to Readings, then counts the Readings that pass. Unrated is its own choice, not a low score; Finish year can be "unknown". Shelf applies to Library only, since Stats already counts finished Readings. A Series facet matches Works whose series name has the same key (case, articles and edition labels aside; (Manga) and (Light Novel) stay different).

**Authors** are matched on the same name only, ignoring case and spacing. "Touya" and "Touya, chibi" are two authors until the reader merges them, and the app never merges them silently. Average ratings use rated Readings only; unrated is stated, never counted as low.

**Series progress** counts volumes (Works), not Readings: a volume is read when any of its Readings is finished. It counts up to the highest volume held, shows whole-number gaps below it, and never counts a volume the app has not seen. Genre, Tag and Series narrow it; Rating and Format do not.

**Drill-through.** Tapping a chart bar, segment or ranked row opens Library with the facets that produce that bar, shown as removable chips so the filter is never hidden.

## Considered options

- Count Works in Stats. Rejected: it hides re-reads and makes per-year totals depend on which Reading is latest.
- Filter on the latest Reading only. Rejected: a Work read in 2023 and 2025 would vanish from a 2023 drill-through.
