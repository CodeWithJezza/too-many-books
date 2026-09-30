---
version: 1
slug: "src-screens-stats-tsx"
primary_target: "src/screens/Stats.tsx"
related_targets: []
---

# Surface brief: Stats (extension of the Library world)

Mode: Read/Operate hybrid: the reader understands their own history at a glance. Inherits DESIGN.md; no new identity.
Content: BUILD_BRIEF Stats charts: books per year (with Date unknown bar), books per month for a year, genre split, rating distribution (half-star buckets, unrated stated separately), format split by year, top authors. All filterable by year; any chart that excludes unknown-date Readings states how many. DNF excluded from finished counts and shown as its own count.
Constraints: no hero-metric template, no sparklines, no gamified goals. Counts are finished Readings (a re-read counts again). Unknown stays unknown.

## Direction contract

THESIS: Books are the unit of measure: every column is a stack of genre-coloured spines, one block per book, so a bar's height is literally a count of books, not an abstraction.
OWN-WORLD: Inherits palette and Jost. Genre inks colour spines and bars; formats use ink, orange and muted brown with numbers printed inside segments; ruled section heads (2px ink rule), no cards, no shadows.
STORY: The reader sees how much they read, when, and in what shape, trusts the numbers because every exclusion is stated, and can jump to a year with one tap.
FIRST VIEWPORT: Year chips, one plain-sentence summary ("22 books finished across all years · 2 did not finish"), then the spine-stack Books per year chart with a legend, followed by month, genres, ratings, formats and authors.
FORM: Extension of Banded Paperback (pick card, seed key 0940e426); no new concept round.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
