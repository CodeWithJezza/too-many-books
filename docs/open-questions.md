# Open questions

## Tags — RESOLVED
Free-form Tags are in v1. See CONTEXT.md: Tag. Per-Work, own-library filtering only (no cross-user discovery, since there's no central catalog).

## Reading goals (out of scope)
Not built and not planned. A target and a count of how far behind it is would turn the Stats screen into pressure, which conflicts with PRODUCT.md principle 5 (calm accounting, no streaks or nudges). Revisit only if that principle changes.

## Pages read (built, optional)
Pages per year and per month are built but hidden until "Show pages read" is ticked under "More charts" on Stats (ADR 0008 states what they count). They rest on one page count per Work, so they are an estimate, and audiobooks are left out.

## Sync and sharing (post-v1)
If the app works well and the reader wants to share it with others, add a backend with accounts and sync. This would revisit ADR 0001. Not built in v1; backup and restore (ADR 0005) is the only way to move a library between devices.

## Better ISBN/series data (if this becomes a commercial product)
Open Library's series and ISBN coverage is good enough for a personal app but not solid enough for a commercial one. If this is ever offered to other people, revisit Metadata providers (ADR 0004) for a source with more reliable series data and ISBN matching (e.g. a paid catalog API), alongside the sync/backend question above.

## Manga and light novels — RESOLVED (tag, not a type)
Manga and light novels stay ordinary Works, distinguished by a Tag ("manga", "light novel"), which the app suggests from the title or Metadata subjects but never assigns. A separate Work type was considered and rejected for now: Libby and Goodreads report them as ordinary ebooks and books, so a second kind would have to be guessed or entered by hand, and would split counts like "books finished" in ways the sources do not support. Tags already filter Library and Stats. Revisit if the Tag filter proves too weak for stats, for example if the reader wants volumes counted apart from books.

## Metadata for light novels and manga (partly done)
AniList is built as a second provider, used only for genre suggestions on books the reader has tagged "manga" or "light novel" in the Inbox (ADR 0004, amended 2026-09-30). Hardcover, Jikan and Google Books were researched and not adopted. Jikan was passed over for its small request limit (60 per minute, 3 per second) and because it scrapes MyAnimeList, which can rate limit it too; Google Books failed on its shared anonymous daily quota when tested. What remains open is ISBN, edition and page-count data for these books, which AniList does not have. The original notes follow.

Open Library does not hold many light novels or manga volumes (checked with Peddler in Another World, Fushi no Kami and its ISBNs), and where it does, subjects are usually empty. The reader's own research points to Hardcover and AniList as alternative providers; ADR 0004 already puts providers behind an interface. At the time of writing neither was built. Things to test when picking one: whether it resolves an ISBN to an edition and its form (Libby gives a light novel and its manga the same title, and only the ISBN differs), whether it returns genres and page counts, whether it can be called from a browser without a secret key (Hardcover's API needs a token), and rate limits.

Known data point from the reader's Libby export: Fushi no Kami: Rebuilding Civilization Starts With a Village, Volume 1 has ISBN 9781718330689 (light novel) and 9781718337596 (manga), under two Libby title IDs with identical titles.
