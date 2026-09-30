# Local-first PWA, single user, no backend

The app is a web app installable as a PWA that stores all data on the user's device, with no server, accounts, or sync. This keeps it free to run, works offline, and reaches any platform rather than being locked to iOS. The cost is that data lives on one device unless the user exports a backup, so full JSON export is a required feature rather than a nice-to-have.

All data is written to persistent on-device storage (IndexedDB), never held only in memory and never in localStorage alone, so it survives closing the app and restarting the device. The app asks the browser for persistent storage so the data is not evicted under storage pressure. Browsers can still clear site data (the user clearing it, or Safari removing data from sites that are not installed to the home screen), which is why regular backups (ADR 0005) are part of the design.

v1 assumes one primary device (the reader's iPad) holding one library. Moving to another device is done by backup and restore, not sync. If the app is later shared with other people, a backend and accounts can be added; the data model should leave room for per-user ownership, but no sync is built in v1.
