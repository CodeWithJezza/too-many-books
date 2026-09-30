---
version: 1
slug: "src-screens-library-tsx"
primary_target: "src/screens/Library.tsx"
related_targets: []
---

# Surface brief: Library (with Work page)

Mode: Operate. Surface: Library screen and selected Work page, side by side on iPad landscape; sidebar nav; phone gets bottom tab bar.
Audience/job: one reader with hundreds of Works, browsing, filtering by Shelf/Genre/Tag/Series/Rating/format/year, opening a Work. Sessions on iPad, evening and daytime.
Constraints: PRODUCT.md, docs/BUILD_BRIEF.md. Unknown dates stay unknown; unrated is not low. Sample data must be labeled synthetic. Local-first; Dexie behind a storage layer.
User-confirmed: light eggshell/papyrus base by default, not stark white, not grey; warm dark theme as a toggle; Banded Paperback direction.
Unresolved: real cover art via Open Library (placeholder jackets until then); Inbox, Stats, Add screens.

## Direction contract

THESIS: The library is a wall of paperback jackets, not a table or a card feed; Genre is colour, covers lead, chrome recedes. It refuses the Goodreads shelf-with-wood and the SaaS dashboard.
OWN-WORLD: Eggshell/papyrus ground (#f2ead6, panels #e7dbbb/#ece1c6), warm brown ink (#2b2218), cream jackets (#fbf6e7). Three-band jacket: saturated Genre band on top with author, cream middle with large title between hairline rules, foot band carrying series or Genre label. Selection is a double ink ring; the accent ring is reserved for keyboard focus. Genre inks blue #1f3e8c, green #2e7d4f, magenta #a3286b, plus burnt orange #c9500f as the single UI accent. Jost. Warm dark brown theme (#241d16) as a toggle; jackets stay cream.
STORY: The reader sees their books as objects, finds one fast, and opens its Readings and Loans beside the wall without losing their place.
FIRST VIEWPORT: iPad landscape. 190px sidebar (Library, Inbox, Stats, Settings, Add at the foot); centre a 5-column jacket grid under title and filter chips; right 360px Work panel with the selected jacket, tags, Readings, Loans. Selected jacket lifts and takes a double ink ring. Add is bottom of sidebar. The Inbox count badge waits for real Inbox data; never fake a number.
FORM: Banded Paperback, the assigned-pick card (impeccable's pick), not the roll (Fahrplan index 5); seed key 0940e426.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
