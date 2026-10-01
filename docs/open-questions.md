# Open questions

## Tags — RESOLVED
Free-form Tags are in v1. See CONTEXT.md: Tag. Per-Work, own-library filtering only (no cross-user discovery, since there's no central catalog).

## Sync and sharing (post-v1)
If the app works well and the reader wants to share it with others, add a backend with accounts and sync. This would revisit ADR 0001. Not built in v1; backup and restore (ADR 0005) is the only way to move a library between devices.

## Better ISBN/series data (if this becomes a commercial product)
Open Library's series and ISBN coverage is good enough for a personal app but not solid enough for a commercial one. If this is ever offered to other people, revisit Metadata providers (ADR 0004) for a source with more reliable series data and ISBN matching (e.g. a paid catalog API), alongside the sync/backend question above.

## Manga and light novels — RESOLVED (tag, not a type)
Manga and light novels stay ordinary Works, distinguished by a Tag ("manga", "light novel"), which the app suggests from the title or Metadata subjects but never assigns. A separate Work type was considered and rejected for now: Libby and Goodreads report them as ordinary ebooks and books, so a second kind would have to be guessed or entered by hand, and would split counts like "books finished" in ways the sources do not support. Tags already filter Library and Stats. Revisit if the Tag filter proves too weak for stats, for example if the reader wants volumes counted apart from books.
