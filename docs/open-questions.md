# Open questions

## Tags — RESOLVED
Free-form Tags are in v1. See CONTEXT.md: Tag. Per-Work, own-library filtering only (no cross-user discovery, since there's no central catalog).

## Sync and sharing (post-v1)
If the app works well and the reader wants to share it with others, add a backend with accounts and sync. This would revisit ADR 0001. Not built in v1; backup and restore (ADR 0005) is the only way to move a library between devices.

## Better ISBN/series data (if this becomes a commercial product)
Open Library's series and ISBN coverage is good enough for a personal app but not solid enough for a commercial one. If this is ever offered to other people, revisit Metadata providers (ADR 0004) for a source with more reliable series data and ISBN matching (e.g. a paid catalog API), alongside the sync/backend question above.
