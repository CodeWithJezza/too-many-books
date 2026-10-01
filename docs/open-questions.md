# Open questions

## Tags — RESOLVED
Free-form Tags are in v1. See CONTEXT.md: Tag. Per-Work, own-library filtering only (no cross-user discovery, since there's no central catalog).

## Sync and sharing (post-v1)
If the app works well and the reader wants to share it with others, add a backend with accounts and sync. This would revisit ADR 0001. Not built in v1; backup and restore (ADR 0005) is the only way to move a library between devices.

## Better ISBN/series data (if this becomes a commercial product)
Open Library's series and ISBN coverage is good enough for a personal app but not solid enough for a commercial one. If this is ever offered to other people, revisit Metadata providers (ADR 0004) for a source with more reliable series data and ISBN matching (e.g. a paid catalog API), alongside the sync/backend question above.

## Manga and light novels — RESOLVED (tag, not a type)
Manga and light novels stay ordinary Works, distinguished by a Tag ("manga", "light novel"), which the app suggests from the title or Metadata subjects but never assigns. A separate Work type was considered and rejected for now: Libby and Goodreads report them as ordinary ebooks and books, so a second kind would have to be guessed or entered by hand, and would split counts like "books finished" in ways the sources do not support. Tags already filter Library and Stats. Revisit if the Tag filter proves too weak for stats, for example if the reader wants volumes counted apart from books.

## Metadata for light novels and manga (later)
Open Library does not hold many light novels or manga volumes (checked with Peddler in Another World, Fushi no Kami and its ISBNs), and where it does, subjects are usually empty. The reader's own research points to Hardcover and AniList as alternative providers; ADR 0004 already puts providers behind an interface. Not built; the reader is researching them first. Things to test when picking one: whether it resolves an ISBN to an edition and its form (Libby gives a light novel and its manga the same title, and only the ISBN differs), whether it returns genres and page counts, whether it can be called from a browser without a secret key (Hardcover's API needs a token), and rate limits.

Known data point from the reader's Libby export: Fushi no Kami: Rebuilding Civilization Starts With a Village, Volume 1 has ISBN 9781718330689 (light novel) and 9781718337596 (manga), under two Libby title IDs with identical titles.
