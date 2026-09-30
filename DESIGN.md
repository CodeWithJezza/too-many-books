---
name: Too Many Books
description: A reading library shown as a wall of banded paperback jackets on eggshell paper, with a warm dark toggle.
colors:
  accent: "#c9500f"
  accent-dark: "#e8792b"
  on-accent: "#ffffff"
  on-accent-dark: "#1a1510"
  error: "#a3260f"
  error-dark: "#ff9a6b"
  ink: "#2b2218"
  ink-dark: "#f0e6cf"
  muted-ink: "#6b5d48"
  muted-ink-dark: "#b8a98c"
  papyrus: "#f2ead6"
  sidebar-vellum: "#e7dbbb"
  panel-parchment: "#ece1c6"
  jacket-cream: "#fbf6e7"
  jacket-cream-dark: "#f3ead4"
  rule-tan: "#d2c4a1"
  rule-tan-dark: "#4a3f30"
  star-off: "#8a7a52"
  star-off-dark: "#7d6e56"
  star-fill: "#ddd0ac"
  star-fill-dark: "#3a3125"
  night-bg: "#241d16"
  night-sidebar: "#1a1510"
  night-panel: "#2d251c"
  genre-scifi: "#1f3e8c"
  genre-fantasy: "#2e7d4f"
  genre-historical: "#a3286b"
  genre-mystery: "#0f6b78"
  genre-romance: "#b3243b"
  genre-nonfiction: "#8a5a00"
  genre-literary: "#4a4a7a"
typography:
  display:
    fontFamily: "Jost Variable, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  display-phone:
    fontFamily: "Jost Variable, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Jost Variable, system-ui, sans-serif"
    fontSize: "27px"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.005em"
  heading:
    fontFamily: "Jost Variable, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.4
  subhead:
    fontFamily: "Jost Variable, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1.1
  group-title:
    fontFamily: "Jost Variable, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.15
  panel-title:
    fontFamily: "Jost Variable, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 800
    lineHeight: 1.4
  title:
    fontFamily: "Jost Variable, system-ui, sans-serif"
    fontSize: "clamp(15px, 13cqw, 27px)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.005em"
  body-lg:
    fontFamily: "Jost Variable, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: "Jost Variable, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.4
  body-sm:
    fontFamily: "Jost Variable, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.45
  caption:
    fontFamily: "Jost Variable, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
  caption-sm:
    fontFamily: "Jost Variable, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.25
  label:
    fontFamily: "Jost Variable, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.12em"
  label-lg:
    fontFamily: "Jost Variable, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.14em"
rounded:
  sm: "3px"
  md: "4px"
  lg: "6px"
  pill: "99px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "28px"
  xl: "48px"
components:
  button-add:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.papyrus}"
    rounded: "{rounded.md}"
    height: "48px"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    typography: "{typography.body-lg}"
    padding: "0 28px"
    height: "52px"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    padding: "0 22px"
    height: "48px"
  button-quiet:
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "44px"
  shelf-tab:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "44px"
  shelf-tab-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.papyrus}"
  segmented-option:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    typography: "{typography.body-sm}"
    padding: "0 16px"
    height: "44px"
  segmented-option-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.papyrus}"
  search-field:
    backgroundColor: "{colors.jacket-cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "46px"
  text-field:
    backgroundColor: "{colors.jacket-cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "10px 14px"
    height: "48px"
  combo-results:
    backgroundColor: "{colors.jacket-cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  combo-result:
    textColor: "{colors.ink}"
    padding: "10px 14px"
    height: "52px"
  combo-result-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.papyrus}"
  star-slot:
    size: "48px"
  link-button:
    textColor: "{colors.ink}"
    padding: "0 8px"
    height: "44px"
  tag-chip:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    typography: "{typography.body-sm}"
    padding: "2px 4px 2px 12px"
  tag-remove:
    rounded: "{rounded.pill}"
    size: "40px"
  reading-fieldset:
    backgroundColor: "{colors.panel-parchment}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  changes-list:
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
  genre-pick:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "44px"
  genre-pick-selected:
    backgroundColor: "{colors.genre-scifi}"
    textColor: "{colors.on-accent}"
  jacket:
    backgroundColor: "{colors.jacket-cream}"
    textColor: "{colors.ink}"
    rounded: "0"
  jacket-band:
    backgroundColor: "{colors.genre-scifi}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label}"
  jacket-mini:
    width: "72px"
  jacket-preview:
    width: "200px"
  nav-item:
    textColor: "{colors.ink}"
    height: "48px"
    padding: "0 20px"
  nav-item-current:
    backgroundColor: "{colors.papyrus}"
  genre-chip:
    backgroundColor: "{colors.genre-scifi}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  ledger-row:
    backgroundColor: "{colors.jacket-cream}"
    textColor: "{colors.ink}"
    padding: "12px 14px"
  inbox-group-row:
    textColor: "{colors.ink}"
    typography: "{typography.group-title}"
    padding: "18px 0"
  confirm-panel:
    backgroundColor: "{colors.jacket-cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  action-bar-sticky:
    backgroundColor: "{colors.papyrus}"
    textColor: "{colors.ink}"
    padding: "14px 0"
  undo-bar:
    backgroundColor: "{colors.panel-parchment}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px 14px"
  stats-spine:
    backgroundColor: "{colors.genre-scifi}"
    rounded: "0"
    width: "28px"
    height: "10px"
  stats-track:
    backgroundColor: "{colors.panel-parchment}"
    rounded: "{rounded.md}"
    height: "22px"
  stats-format-ebook:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.papyrus}"
  stats-format-audiobook:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
  stats-format-print:
    backgroundColor: "{colors.muted-ink}"
    textColor: "{colors.papyrus}"
  stats-column-selected:
    backgroundColor: "{colors.panel-parchment}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.papyrus}"
    rounded: "{rounded.lg}"
    padding: "14px 18px"
---

# Design System: Too Many Books

## Overview

**Creative North Star: "The Banded Paperback"**

The library is a wall of paperback jackets on eggshell paper. Genre is colour, the covers lead, and the chrome (sidebar, panel, filters) sits quietly in tones of the same paper. The ground is warm papyrus rather than white or grey, and all ink is warm brown rather than black. One burnt orange is the only UI accent; every other saturated colour belongs to a Genre and appears on a jacket band.

The system is dense but calm: a three-column shell (sidebar, jacket wall, Work panel) with generous 20 to 30px gutters between objects and tight, flat control chrome. Type is a single geometric sans (Jost) at heavy weights for titles and small tracked capitals for band labels, which echo printed paperback spines. Depth comes from tonal paper layers and from the jackets casting soft shadows like objects on a table.

Stats extends it with one more idea: a chart is a stack of books. Each finished book is one flat genre-ink block (a spine), so a column's height is a literal count, and horizontal bars sit on a Panel Parchment track. Task screens (Add, Inbox, Settings, Stats) extend the same world: lists and forms are quiet ruled rows on the papyrus ground, and a jacket appears only where a book is being chosen or shaped (mini jacket beside an Inbox group, live preview beside the Add form). A warm dark theme (toggle) swaps the paper for brown-black and lifts the accent, but jackets stay cream so the wall still reads as objects.

**Key Characteristics:**
- Eggshell/papyrus light default; warm dark brown theme by toggle, never stark white, grey, or pure black.
- Genre ink is a flat band colour on the jacket and its chips; white text on every genre ink.
- One UI accent (burnt orange), used for keyboard focus, current-nav marks, filled stars, text selection, and the single primary action of a view.
- Selection is a double ink ring on jackets and an ink fill on pills and options; the accent ring is reserved for keyboard focus.
- Single family (Jost); hierarchy by weight (800 titles, 500 UI, 600 labels) and size.
- Real covers fill the middle of a jacket when known; the bands stay.
- Data is drawn in the same flat genre inks: square spine blocks, 4px-radius bar tracks, counts printed in or beside the mark, no gradients or shadows.

## Colors

A paper-and-ink palette: four warm parchment tones, one brown ink, one orange accent, one rust error, and a set of saturated genre inks that appear only on jackets and genre chips.

### Primary
- **Burnt Orange** (#c9500f light, #e8792b dark): the single UI accent. Focus ring, text selection, current-nav icon, filled stars, the brand tick above the wordmark, phone tab-bar marker, the Inbox count badge, and the one primary action per view (Save, Download backup). White text on it in light, deep brown (#1a1510) in dark.

### Secondary
- **Rust Error** (#a3260f light, #ff9a6b dark): inline form errors and the destructive Replace action only. Text on the light fill is white; on the dark fill it is deep brown (#1a1510).

### Neutral
- **Papyrus** (#f2ead6): page ground, the current-nav fill, the sticky action bar.
- **Sidebar Vellum** (#e7dbbb): the sidebar, one step darker than the ground.
- **Panel Parchment** (#ece1c6): the Work panel, picked-book card, summary and undo bars.
- **Jacket Cream** (#fbf6e7; #f3ead4 in dark): jackets, search, text and select fields, combobox results, ledger rows, confirm panel. It stays light in both themes.
- **Warm Ink** (#2b2218; #f0e6cf in dark): all primary text and the filled state of the Add button, selected tab, segmented option, and active result.
- **Muted Ink** (#6b5d48; #b8a98c in dark): captions, counts, hints, unrated label.
- **Tan Rule** (#d2c4a1; #4a3f30 in dark): hairlines, field borders, panel divider, disabled primary fill.
- **Star Outline / Star Fill** (#8a7a52 and #ddd0ac light; #7d6e56 and #3a3125 dark): the empty-star stroke and interior. Filled stars use Burnt Orange.
- **Format fills (Stats)**: Ebook is Warm Ink with Papyrus text, Audiobook is Burnt Orange with on-accent text, Print is Muted Ink with Papyrus text; counts are printed inside each segment. The rating bars are Warm Ink.
- **Night ground / sidebar / panel** (#241d16 / #1a1510 / #2d251c): the dark theme's three paper layers.

### Genre inks
- **Sci-fi Blue** (#1f3e8c), **Fantasy Green** (#2e7d4f), **Historical Magenta** (#a3286b), **Mystery Teal** (#0f6b78), **Romance Crimson** (#b3243b), **Nonfiction Ochre** (#8a5a00), **Literary Slate** (#4a4a7a). Defined in the genre module, applied through a per-jacket ink variable. White text on each clears 4.5:1 per the source comment.

### Named Rules
**The Genre Is Colour Rule.** Saturated hue other than the orange accent appears only as a Genre ink on a band, chip, genre pick, section header, or Stats spine and genre bar. Chrome stays paper and ink.

**The Cream Stays Cream Rule.** Jackets and the surfaces that hold reading content stay cream in both themes; only the surrounding paper goes dark.

**The One Primary Rule.** Orange fills exactly one button per view. Every other action is a quiet outlined button or an underlined link.

**The Error Is Rare Rule.** Rust is for a failed input or a step that destroys data, never for decoration or emphasis.

## Typography

**Display Font:** Jost Variable (with system-ui, sans-serif)
**Body Font:** Jost Variable
**Label Font:** Jost Variable, in tracked capitals

**Character:** A friendly geometric sans at heavy weight, like a paperback title. Tabular numerals are on globally so counts and years align.

### Hierarchy
- **Display** (800, 36px, 1.05; 30px on phone): screen title, balanced wrap.
- **Headline** (800, 27px, 1.08): Work title in the panel.
- **Heading** (800, 24px): state titles and Settings section titles.
- **Subhead** (800, 22px, 1.1): empty-panel title and the picked-book title on Add; wordmark is also 22px uppercase.
- **Group title** (800, 20px, 1.15): Inbox group row title; the Stats summary sentence sets the same size at 700.
- **Panel title** (800, 18px): confirm panel heading.
- **Title** (800, clamp(15px, 13cqw, 27px), 1.1): jacket title, scaling with jacket width via container query; 24px fixed on the 200px preview jacket, 11px on the mini jacket.
- **Body large** (500, 17px): nav labels, Work author, primary button text, author lines.
- **Body** (400 to 700, 16px, 1.4): inputs, row and result titles, most buttons.
- **Body small** (500, 15px, 1.45): shelf tabs, segmented options, genre picks, review text, notes, nudges.
- **Caption** (400 to 700, 14px): meta lines, result and row subtitles, star readout, theme toggle, Stats column counts (700).
- **Caption small** (400 to 700, 13px, no tracking): counts, hints, chips, captions under jackets, sample notes, Inbox lookup line, Stats axis labels and in-segment format counts (700).
- **Label** (600, 11px, 0.12em top, 0.08em foot, uppercase): jacket top and foot bands. The foot band is nowrap and ellipsizes; a series shows "Genre · N".
- **Label large** (600, 12px, 0.14em, uppercase): panel section-header bar; also 12px for the phone tab labels, badge, and Unrated.

### Named Rules
**The One Family Rule.** Jost only. Hierarchy comes from weight and size, never a second face.

**The Band Caps Rule.** Tracked uppercase is reserved for text sitting on a genre-ink band (jacket bands, panel section-header bar), where it mimics a printed spine.

**The Ramp Is Closed Rule.** New type uses a size from the list above. A new surface picks the nearest step rather than adding a size.

## Layout

A full-height grid: 184px sidebar, fluid centre, 372px Work panel. The centre is an auto-fill wall of jackets (minmax 124px, gaps 30px row by 20px column), each 2:3. Page padding is 28px. Spacing steps observed: 4, 8, 12, 16, 20, 28, 48px.

Stats caps at 1100px: a two-column grid of ruled sections (20px row, 32px column gap) where Books per year and Books per month span both columns; below 900px it is one column. Year columns scroll horizontally, and the month columns tighten to 26px on phone. Task screens keep the sidebar and centre and drop the panel (tab-based grid of sidebar plus centre for the other screens). Add, Inbox, and Edit book cap at 860px; Add's form is 620px wide with 26px between fields, and from 900px a 200px live preview jacket sits in a sticky right column (40px gap, 28px from top). Settings sections are 62ch wide, 24px vertical padding, separated by tan rules. Inbox groups are ruled rows with 18px vertical padding, a mini jacket at the left and content beside it.

Below 1100px the panel becomes a fixed right sheet (max 440px, 92vw) with a scrim. Below 760px the sidebar becomes a 64px bottom tab bar (nav items stacked icon over label, Add as a square 64px slot, badge pinned to the icon), the wall drops to a 100px minimum, shelf tabs scroll horizontally, the panel is full width, and the sticky action bar rides above the tab bar. Touch targets are at least 44px throughout, with one recorded exception (tag remove, 40px; see Not canonized).

## Elevation & Depth

Hybrid: tonal paper layers for chrome, soft warm shadows for objects. Sidebar, ground, and panel differ only by paper tone, with a single 1px tan rule separating the panel. Jackets rest on a two-layer warm shadow and lift on hover. The combobox results list and the update/offline toast are the only other floating layers; the toast is an ink-filled fixed card with a soft shadow, and everything on Stats is shadowless.

### Shadow Vocabulary
- **Jacket at rest** (`0 1px 2px rgb(shadow / 0.28), 0 8px 16px rgb(shadow / 0.16)`): shadow colour is warm brown (40 25 5) in light and black in dark.
- **Jacket lifted** (`0 2px 3px / 0.28, 0 14px 24px / 0.2`, translateY(-4px)): hover on pointer devices.
- **Selected** (`0 0 0 3px bg, 0 0 0 6px ink, 0 12px 22px / 0.2`, translateY(-4px)): double ink ring.
- **Sheet** (`-12px 0 32px / 0.28`): the panel as a sheet on narrow widths.
- **Results list** (`0 12px 28px / 0.22`): the open combobox list.
- **Toast** (`0 12px 28px / 0.3`): the fixed update/offline notice.

### Named Rules
**The Ink Ring Rule.** Selection is a double ring (paper gap, then ink). The 3px orange outline means keyboard focus and nothing else.

**The Flat Bars Rule.** Sticky bars, summaries, and confirm panels separate by a tan hairline or tonal fill, never a shadow. Stats charts follow it: spines and fills are flat colour with no shadow or gradient, tracks are a Panel Parchment fill, and a selected year column takes a tonal fill plus a 2px ink ring.

## Shapes

Jackets are square-cornered rectangles (a printed object). Controls are barely rounded: 3px focus and tag corners, 4px buttons, 6px fields, results list, and panels. Shelf tabs, genre chips, segmented options, and genre picks are full pills (99px). Stats marks are the exception to rounding: spines and bar fills have no radius, and only the 22px bar track carries a 4px radius (the selectable year column is also 4px). Section heads on Stats are ruled by a 2px ink top border, not a card. Hairline 1px tan rules separate rows and outline fields; the confirm panel is the one 2px ink outline. Jackets are three horizontal bands (22% top, flexible cream middle, 14% foot) with two 1px hairlines inside the title area at 12% inset.

## Components

### Buttons
- **Shape:** gently squared (4px).
- **Add:** filled Warm Ink with Papyrus text, 48px tall, weight 700, pinned to the foot of the sidebar; becomes a square 64px tab on phone.
- **Primary:** filled Burnt Orange, on-accent text, 52px tall, 28px side padding, 17px/700; a small variant is 44px, 16px. Disabled falls to Tan Rule fill with muted text.
- **Danger:** filled Rust Error, 48px tall, 22px side padding, 16px/700; used only on the restore confirm.
- **Quiet:** transparent, 1px ink border, weight 600, 44px tall, 18px side padding.
- **Link button:** underlined ink text with a 2px orange underline, a 44px minimum tap height and 8px side padding (inline-flex, so the label stays centred); for Clear, Dismiss, Remove this reading, and disclosure toggles. The `.inline` variant drops the minimum for text inside a sentence.
- **Add a reading:** a Quiet button carrying a 18px plus Icon and an 8px gap; the Icon is decorative, the label carries the meaning.
- **Format select (Inbox):** a native select in the action row, 44px tall, Jacket Cream fill, 1px tan border, 6px radius, with a screen-reader-only label; shown only when the outcome needs a format.
- **Theme toggle:** borderless, muted ink, 14px, 44px tall.
- **Focus:** 3px orange outline, 3px offset. Disabled buttons drop to 50% opacity.

### Chips
- **Shelf tab:** pill, 1px tan border, 44px tall, 15px/500 with a muted 13px count. Selected fills with Warm Ink and Papyrus text.
- **Genre chip (panel):** pill filled with the Genre ink, white 13px/600 text.
- **Tag chip:** pill, 1px tan border, no fill, 15px text. On Edit book each chip ends in a remove button holding the close Icon (16px, drawn in the navigation icon stroke), sized 40px as built and named in its aria-label ("Remove tag X"); chips wrap with an 8px gap.
- **Genre pick (Add):** 44px pill with a 2px Genre-ink outline; pressed fills with the ink and white text. Suggested genres are marked with a small 13px note and are never pre-pressed.

### Segmented control
A wrapped row of 44px pill options (8px gap, 15px/500, 1px tan border) acting as a radio group. The checked option fills Warm Ink with Papyrus text at weight 600. One shared component (Segmented, in FormControls) serves Edit book status and format, date precision, and on the Inbox the "Add as" choice (Finished, Reading now, Want to read, defaulted from the Goodreads shelf) and the fuzzy-match answer (Same book, Different book). Reuse it for any choice of a few named options; do not restyle it per screen.

### Cards / Containers
- **Jacket:** see Signature Component.
- **Ledger row (Readings, Loans):** Jacket Cream, 12px 14px padding, 1px tan bottom rule, headed by a full-width genre-ink section bar.
- **Reading fieldset (Edit book):** each reading is a fieldset on Panel Parchment with a 1px tan border, 6px radius, 16px padding and 16px between its fields; its legend is 15px/800. Status and format Segmented controls, date fields, the half-star rating, and review sit inside; a link button removes it. Readings stack 18px apart above an Add a reading Quiet button.
- **Danger zone (Edit book):** the foot of the form, after a 1px tan rule and 24px of padding: a 24px/800 section title, a plain sentence stating what is removed and what is kept, and a Quiet "Delete book…" button that opens the Confirm panel with the Danger button and a "Keep it" Quiet button.
- **Panel:** Panel Parchment, 28px 26px padding, fades and rises 8px in over 320ms on selection.
- **Picked book (Add):** Panel Parchment card, 1px tan border, 6px radius, 14px padding, mini jacket beside a 22px title, 16px sub, 13px note.
- **Goodreads row (Inbox):** the same ruled row. The source is stated in the 14px muted meta line as words ("Goodreads · Want to read · 4 stars · finished Mar 2024"), never as a badge or tracked label. A review, if any, follows as a 15px muted quote up to 60ch. Below sit the fuzzy-match question with its Same book / Different book Segmented, then the "Add as" Segmented, the lookup line, and the Set genres disclosure. Actions: a small 44px Primary (Add), Just link (Quiet, shown when a match exists), and Dismiss as a link button; a dismissed row offers Restore to Inbox instead.
- **Goodreads update row:** when a record has changed since it was taken, the meta line becomes "Changed at Goodreads since you last took its values:" followed by a changes list (15px, 4px apart, 6px above), one line per field in the form "Rating: 3 stars → 4 stars", with 90 characters of a changed review in curly quotes and "unknown" or "unrated" for empty values. A 13px muted note says edited fields are left as set. Actions are Apply changes (small Primary) and Keep mine (Quiet), with a format select first only when a shelf change needs one. The outcome message names what changed and what was left as the reader set it.
- **Inbox group row:** a ledger-style ruled row on the ground (no card fill): mini jacket at the left, 20px/800 title, 16px author, 14px muted loans line, a 15px match block, and an action row (10px gap, 12px above). Rows are separated by a 1px tan rule with 18px vertical padding.
- **Confirm panel:** Jacket Cream, 2px ink outline, 6px radius, 16px padding, 18px/800 heading, and an action row holding the Danger button beside Cancel. Announced as an alert dialog; the destructive verb names the outcome ("Replace my library", "Delete book", "Discard changes") and the safe answer ("Keep it", "Keep editing") sits beside it.
- **Summary and nudge bars:** Panel Parchment, 6px radius, 12px 14px padding, 500 weight, up to 62ch.
- **Undo bar:** the summary bar as a flex row with the message at the left and a quiet Undo action at the right; appears after every resolved Inbox group.

### Inputs / Fields
- **Style:** Jacket Cream fill, 1px tan border, 6px radius, 46px tall (48px on forms, 52px for the big title search), 16px text, muted placeholder.
- **Labels:** field labels and legends are 13px/700 in muted ink; inline hints are 13px, untracked, sentence case.
- **Focus:** 3px orange outline with 2px offset around the whole field.
- **Error:** message in Rust Error at weight 600 beneath or beside the action row. A field-level error sits directly under its own field, is announced as an alert, and is tied to the input by aria-invalid and aria-describedby.
- **Date field (shared, Edit book):** a fieldset with a 13px legend, a precision Segmented (Day, Month, Year, Unknown), then a native date, month, or year input in the standard field style. Unknown replaces the input with a hint ("Saved as unknown. It won't be guessed from anything else."). An invalid date shows "Enter a date, or choose Unknown." in Rust beneath the input and disables Save.

### Combobox with results
The title field opens a Jacket Cream list 6px below it, 6px radius, 1px tan border, up to 380px tall and scrolling. Each result is a 52px-minimum two-column row (title left at 16px/700, subtitle right at 14px) under a small 11px source label; a manual-entry row sticks to the foot of the list. The active result inverts to Warm Ink fill with Papyrus text. Notes inside the list are 14px muted.

### Half-star input
Five stars, each in a 48px slot with a 36px glyph and two invisible half-buttons (left half, right half) giving 0.5 steps. Outline uses the star-off stroke over the star-fill interior; the filled portion is Burnt Orange, clipped to the value. A readout ("3.5 of 5" or "Unrated", 14px muted) sits beside it with a Clear link once rated. Clicking the current value clears it. Every instance gets its own clip-path ids, so several rating rows on one screen (one per reading) each show their own fill; the readout and Clear stay on one line (no wrapping) beside the stars.

### Sticky action bar
The Add and Edit book Save bars stick to the bottom of the scroll area: Papyrus fill, 1px tan top rule, 14px vertical padding, 10px gap between rows, holding the Primary button, Cancel, and any error. On Edit book the bar also hosts the inline discard confirm: when Cancel or navigation is attempted with unsaved edits, the Confirm panel opens inside the bar above the actions (Discard changes as Danger, Keep editing as Quiet, focus moved to Keep editing); with nothing to lose, Cancel leaves at once. On phone it lifts above the 64px tab bar.

### Navigation
Sidebar list of 48px rows: icon (1.75px stroke line icons, inline SVG), label at 17px/500, muted 13px count. Current page: weight 700, Papyrus fill, orange icon. The Inbox carries a count badge (orange pill, 12px/700, on-accent text). The wordmark is 22px/800 uppercase with a 44x6px orange tick above. On phone the same items become a bottom bar with a 3px orange inset top marker for current.

### Signature Component: Banded Jacket
A 2:3 cream jacket in three bands: a genre-ink top band carrying the author (11px/600 tracked caps, white), a cream middle with a large centred 800 title (optional small series name beneath) between two hairlines, and a genre-ink foot band carrying the Genre label, or Genre and series position. When a cover exists, the image fills the middle edge to edge (object-fit cover, no padding, hairlines removed) and the bands stay. The foot band never wraps: it ellipsizes at 0.08em tracking and, for a series, reads "Genre · N". Sizes: wall 124px and up, panel 108px, preview 200px (24px title), mini 72px (60px on phone; band text hidden, 11px title). Hover lifts 4px over 260ms on an expo-out curve (`cubic-bezier(0.16, 1, 0.3, 1)`); motion is removed under reduced-motion.

### Stats charts
Ruled sections, not cards: each section opens with a 2px Warm Ink top rule, a 24px/800 title, and 14px of gap. Above them sit year chips (the shelf tab pill, All years plus each year) and a 20px/700 plain-sentence summary; every exclusion is stated in a 13px muted hint.
- **Spine stack:** columns of 28px-wide, 10px-tall flat blocks, one per book, 2px apart, stacked from the baseline in the book's first-genre ink. Count above (14px/700), label below (13px muted). A dashed 1px tan rule separates the Date unknown column. Year columns are buttons: selected takes Panel Parchment fill and a 2px ink ring. A legend of 14px genre swatches sits beneath.
- **Horizontal bars (Genres, Formats, Authors):** rows of 96px label, bar, 32px right-aligned count (15px, 700 for the count). The track is 22px tall, Panel Parchment, 4px radius, clipped; the fill is a flat genre ink scaled to the count. The current year's row is 800 weight.
- **Format split:** one stacked bar per year; segments use the format fills with the count printed inside (13px/700, 22px minimum width).
- **Ratings:** half-star columns of 24px Warm Ink bars (2px minimum) with count above and half-star label below; Unrated is stated separately in a hint.
- **Ranked authors:** a 28px position numeral (800, muted), name, and count on the same row grid.
- Each chart has a visually hidden table twin; the visible columns are aria-hidden.

### Toast
A fixed Warm Ink card, bottom right at 20px (max 420px wide), 6px radius, 14px 18px padding, 500 weight, Papyrus text, and a Reload or Got it link button whose underline stays orange. On phone it spans the width and rides above the tab bar. Announced as a status; carries the update-ready and offline-ready notices only.

### Edit book
The Add form's layout reused for an existing book (860px cap, live preview jacket at right from 900px): title, author, genre picks, tag list with a type-then-Enter input, series, position and pages in a 2fr 1fr 1fr row (one column on phone), a Want to read checkbox (22px box, orange check, 44px row), Readings, then the sticky bar, then the danger zone. It has no new colours or type sizes: everything is the Add form's parts plus the Segmented, Date field, Tag chip, Reading fieldset, and Confirm panel above.

### Date precision
**The Unknown Stays Unknown Rule.** Changing a date's precision never invents a value. Going finer than what is known (Year to Month, Month to Day, or leaving Unknown) empties the date so the reader must enter it; going coarser keeps the value and the stored part is trimmed; choosing Unknown keeps the text but saves nothing. This is the build's withPrecision behaviour.

### Inbox lookup and genre disclosure
Under each unresolved group, a 13px muted lookup line states the Open Library outcome (checking, found and what will be added, no sure match, could not reach) and reserves its line height so the row does not jump. On Goodreads rows the lookup line appears only when a new book would be made, and the genre picks use the small 14px variant. Below it a link button acts as a disclosure (aria-expanded): "Set genres", "Set genres (N suggested)", or the chosen genres; it opens the 44px genre picks (14px, 12px side padding), collapsed by default.

### Star rating
Five 16px stars, half-step fills by clip; filled Burnt Orange over the star-fill interior with a star-off outline. Unrated shows the italic word "Unrated" in muted ink, never empty stars.

## Do's and Don'ts

### Do:
- **Do** keep the ground eggshell/papyrus (#f2ead6) and ink warm brown (#2b2218); the dark theme uses brown-black (#241d16), never neutral grey or pure black.
- **Do** carry Genre as a flat band ink on the jacket and matching chip, with white text.
- **Do** use burnt orange only for focus, current marks, filled stars, selection highlight, the count badge, and the single primary action of a view.
- **Do** mark selection with the double ink ring and a 4px lift on jackets, and with an ink fill on pills, options, and results.
- **Do** confirm or offer Undo for every destructive or bulk step; the confirm names the outcome.
- **Do** pick type from the closed ramp and keep touch targets at or above 44px; honour `prefers-reduced-motion`.
- **Do** show unknown as unknown ("Unrated", "unknown" date), not as a zero state, and never fill a date the reader has not given (The Unknown Stays Unknown Rule).
- **Do** state a data source in the meta line as plain words and reuse the shared Segmented and Date field for choices instead of building new ones.
- **Do** give every repeated control instance its own ids (star clips, date fields, review labels).
- **Do** let a real cover replace the jacket middle while keeping both bands.

### Don't:
- **Don't** put a second saturated colour in the chrome; hue belongs to Genre, with rust reserved for errors and destruction.
- **Don't** use the orange ring for selection or the ink ring for focus.
- **Don't** turn the wall into a table, a feed of white cards, or a wood-shelf skeuomorph, and don't turn Inbox or Settings into a card grid; they stay ruled rows.
- **Don't** darken jackets in the dark theme.
- **Don't** add a second type family or use tracked capitals off a genre-ink band.
- **Don't** put a shadow on a bar, summary, or confirm panel.

### App icon
The authored icons in `public/icons` (`icon.svg`, `icon-maskable.svg`, with raster exports) are a flat jacket motif on a Papyrus square: a short orange tick above, a cream jacket with sci-fi blue top and foot bands, two faint hairlines, and two Warm Ink title bars. The maskable version scales the motif to 80% and centres it in the safe zone. Square corners, no shadow, same tokens as the app.

## Not canonized (build drift)

- Tracked uppercase off a genre-ink band: field labels and legends (13px/700, 0.1em), combobox source labels (11px), and the row tag (11px) break the Band Caps Rule; recorded as build, not as a pattern for new surfaces.
- The file-picker label uses a 3px ink focus outline instead of the orange keyboard-focus ring.
- Dark-theme star-fill (#3a3125) is dark, but stars also render on Jacket Cream rows, so empty stars there read as dark blobs; the token pair is recorded as built, not as a target.
- Stats fills Audiobook segments with Burnt Orange as a data colour, beyond the accent's listed uses; recorded as built, not as licence to use orange for chart series elsewhere.
- Stats bar labels drop to 12px on phone month columns (below the 13px caption-small step); recorded as build size, not a step.
- Tag remove buttons on Edit book are 40px, below the 44px floor; an open item, not a target size. The Edit book `edit-btn` rule (40px) is likewise below the floor.
- The Add-as and Format choices on Goodreads rows put an orange Primary in every row of a list, stretching The One Primary Rule; recorded as built.
- Edit book's field labels, date legends, and reading legends inherit the tracked-uppercase drift listed above.
- Band and section-header text at 11 to 12px is small for iPad reading; recorded as build size, not a target for new surfaces.

## Open items

- Merge entry point on the Work page: not built; no pattern is recorded.
- Shelf management beyond Want to read: not built; only the Want to read checkbox exists.
- Tag remove is 40px and should reach 44px.
