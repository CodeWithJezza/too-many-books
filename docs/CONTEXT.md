# Reading Tracker

A personal, local-first app for recording the books a person has read, with an optional review inbox for importing borrowing history from Libby. Books can also be added by hand.

## Language

**Work**:
A book in the abstract, independent of format or edition (e.g. *Project Hail Mary*). The thing a person has an opinion about. A Work collects the identifiers of every edition the reader has met (Libby title IDs, ISBNs, Goodreads IDs), so later imports recognise it.
_Avoid_: Book, title, edition

**Reading**:
One read-through of a Work, with a format, start and finish dates, a status, a rating, and a short review. A Work can have any number of Readings, and a Reading can follow one or several Loans.
_Avoid_: Read, entry, log

**Series**:
An ordered group of Works that share a series name. Each Work's position may be fractional (e.g. 2.5 for a novella). The app suggests a Series and position from a title pattern such as "Name, Volume 3" but never assigns one without the reader's confirmation. A Series page shows every volume in the library in order, marking which the reader has read, and shows whole-number gaps below the highest volume held; it never invents a volume past that. A manga and its light novel are separate Series.
_Avoid_: Saga, universe

**Loan**:
A single borrow from a library. Libby imports supply them in bulk (identified per ADR 0002); the reader can also record one by hand when adding or editing a Reading, with the library and borrow date both optional. A Loan is evidence of borrowing, not of reading: it may lead to a Reading (its `readingId`), share a Reading with other Loans of the same Work, or lead to nothing. Existing Loans are never linked to a Reading by guesswork. Imported Loans are never edited; manual ones follow their Reading.
_Avoid_: Checkout, borrow

**Import**:
One run of bringing a Libby or Goodreads export file into the app. Overlapping Imports are expected; Import records already seen are not proposed again.
_Avoid_: Sync, upload

**Finish date**:
When a Reading was completed, recorded at day, month, or year precision, or left unknown. An import supplies the best date its source has: a Loan gives the borrow month, a Goodreads row gives its Date Read, or unknown if it has none. Unknown is never guessed from another field.
_Avoid_: Date read, fuzzy date

**Inbox**:
Where unreviewed Import records wait, grouped by Work, until each group is resolved as finished, want to read, or dismissed. Dismissing applies to the Import records, not the Work, and can be undone.
_Avoid_: Queue, import review

**Shelf**:
A named list of Works. The reader can create their own Shelves. "Currently reading" and "Read" are built-in and fill themselves in from Readings; "Want to read" and the reader's own Shelves are filled in by hand.
_Avoid_: List, collection

**Import record**:
One row from an import file (a Loan for Libby, a Goodreads row for Goodreads). Import records are remembered permanently, including dismissed ones, so a later Import can recognise them. Every source goes through the Inbox. An Import record that has changed at its source since it was last seen returns to the Inbox as an update showing only the changed fields; fields the reader has edited in the app are never overwritten.
_Avoid_: Source row, staged item

**Metadata**:
Descriptive details about a Work (cover, page count, subjects, series) looked up from an outside catalog. Metadata is offered as suggestions and never overwrites what the reader has entered.
_Avoid_: Enrichment, book info

**Metadata provider**:
An outside catalog the app looks up Metadata from. Open Library is the primary provider. AniList is also used, only for genre suggestions on books the reader has tagged "manga" or "light novel". Others can be added later.
_Avoid_: Source, API

**Genre**:
A category from a controlled list that the reader chooses from; free-form genres are not allowed. Genres belong to a Work, and a Work can have several. The app suggests Genres from Metadata subjects but never assigns one without the reader's confirmation.
_Avoid_: Category, tag

**Rating**:
A Reading's score from half a star to five stars, in half-star steps. Optional: a Reading with no Rating is unrated, which is different from a low score. A Work shows its latest Reading's Rating.
_Avoid_: Score, stars

**DNF**:
A Reading status meaning the reader stopped before finishing. Its Finish date records when they stopped. A DNF Reading can have a Rating and a review, does not put its Work on the Read shelf, and is counted separately from finished Readings in stats.
_Avoid_: Abandoned, quit

**Merge**:
Combining two Works into one when they are the same book, for example different editions with different ISBNs. The surviving Work keeps every Reading, Shelf membership, and identifier of both, so later imports recognise either edition. Merging is permanent; there is no split.
_Avoid_: Dedupe, combine

**Add**:
The single form for logging a book: a title lookup (library, then Open Library) followed by a status (Reading now, Finished, DNF, Want to read) that determines which fields appear. A Work is created here, never as its own separate step.
_Avoid_: New book, create Work

**Tag**:
A free-form word or short phrase the reader attaches to a Work (e.g. "isekai", "cozy", "found family"), for filtering their own library without creating a Shelf for it. A Work can have several. Existing Tags are suggested while typing, to keep the reader's own vocabulary consistent, but any new Tag can be typed.
_Avoid_: Label, keyword
