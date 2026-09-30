# Metadata comes through a swappable provider; Open Library only in v1, Hardcover as a planned expansion

Metadata (cover, page count, subjects, series) is fetched through a provider interface so sources can be added without touching the rest of the app. v1 ships Open Library alone, because it needs no API key or account and therefore works for any user who installs the app, which matters for a local-first app with no backend and no shared credentials.

Hardcover is the planned second provider. Its GraphQL API is free and searchable by series, which is likely stronger than Open Library for series data, but each user would need to create their own API token in their Hardcover account settings, and the API is currently in beta. It would be added as an optional provider where the user pastes their own token.

Lookups run automatically for Inbox items, shown as suggestions, and on demand from a Work's page; results are cached on the device. Metadata never overwrites reader-entered fields (see ADR 0003).

Open item to verify before the build: whether Open Library (and, later, Hardcover) can be called directly from a browser without a proxy, since there is no backend.
