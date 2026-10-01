# Import Libby JSON only, borrows only, identified by library + title ID + borrow time

The importer accepts Libby's JSON timeline export and reads only `Borrowed` rows; all other activity is ignored. A Loan is identified by library key, Libby `titleId`, and the millisecond borrow timestamp, which was unique for all 305 rows in a real export and never changes between exports. ISBN, format, and title text are stored but never used for identity, because ISBN is missing on some rows and title text is unstable. Libby's CSV is not supported: it drops the title ID and library key, and its timestamp is a timezone-less local-time string, so the same borrow cannot be matched reliably across exports.

These identity rules apply to imported Loans only. A Loan can also be entered by hand (`source: 'manual'`) on the Add and Edit screens; it has no import key, its borrow date and library are optional, and it follows its Reading. Imported Loans are never edited. A Loan may carry a `readingId` tying it to the Reading it led to.

Two Libby records with the same title but different title IDs in the same format are kept as separate groups in the Inbox, since Libby gives a manga and its light novel the same title. An ebook and an audiobook of one title still group together.
