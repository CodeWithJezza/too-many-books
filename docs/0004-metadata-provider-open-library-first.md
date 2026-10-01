# Metadata comes through a swappable provider; Open Library only in v1, Hardcover as a planned expansion

Metadata (cover, page count, subjects, series) is fetched through a provider interface so sources can be added without touching the rest of the app. v1 ships Open Library alone, because it needs no API key or account and therefore works for any user who installs the app, which matters for a local-first app with no backend and no shared credentials.

Hardcover is the planned second provider. Its GraphQL API is free and searchable by series, which is likely stronger than Open Library for series data, but each user would need to create their own API token in their Hardcover account settings, and the API is currently in beta. It would be added as an optional provider where the user pastes their own token.

Lookups run automatically for Inbox items, shown as suggestions, and on demand from a Work's page; results are cached on the device. Metadata never overwrites reader-entered fields (see ADR 0003).

Open item to verify before the build: whether Open Library (and, later, Hardcover) can be called directly from a browser without a proxy, since there is no backend.

## Amendment, 2026-09-30

Open Library remains the primary provider. AniList (`src/metadata/anilist.ts`) was added as a second, narrow one: it is used only for genre suggestions on books the reader has tagged "manga" or "light novel" in the Inbox, and only for the form the reader chose, because Libby gives a manga and its light novel the same title. It needs no key and works from the browser, but it catalogues series, not editions, so it has no ISBNs or page counts. Hardcover, Jikan and Google Books were researched and not adopted; Hardcover remains possible later, but still needs a per-user token. See `docs/open-questions.md`.

Title matching against Open Library was loosened: a leading article, edition labels such as "(Unabridged)", "Volume" versus "Vol.", and partial author names no longer block a match. The volume number and form markers such as "(Manga)" and "(Light Novel)" are kept, so Vol. 3 never matches Vol. 2 and a manga never matches its light novel. The "light novel" and "manga" Tags are suggested from the title or subjects, never assigned.
