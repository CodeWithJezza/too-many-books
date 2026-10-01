# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + TypeScript, Dexie over IndexedDB, PWA plugin, Vitest (docs/0006-tech-stack-and-extensibility.md).

## Users

One reader with a large personal library, on an iPad (installed PWA; phone occasionally). Sessions: evening on the couch or in bed, quick daytime logging, and long sit-downs clearing the Inbox after a Libby import or browsing Stats. Personal first, but designed so it could ship to other people later.

## Product Purpose

A local-first reading tracker: record what you've read, optionally import Libby borrowing history and Goodreads exports through a review Inbox, and see your reading history in stats. Success: the library is trustworthy, adding a book takes seconds, and clearing a backlog feels finishable.

## Positioning

Your data stays on your device (no backend, no accounts), imports are proposals you review rather than silent merges, and local edits always win. Unknown dates stay unknown; unrated is not low-rated.

## Operating Context

Vocabulary is fixed in docs/CONTEXT.md: Work, Reading, Series, Loan, Inbox, Shelf, Genre, Tag, Rating (half-stars), DNF, Merge, Add. Screens: Library, Inbox, Stats, Settings, Add. Sidebar on iPad with Library and Work page side by side; bottom tab bar on phone.

## Capabilities and Constraints

Offline, touch-first. Open Library metadata (covers, subjects) as suggestions only; AniList supplies genre suggestions for books tagged manga or light novel. Stats: books per year/month, genre split, rating distribution, format split, top authors, Library loans, all filterable by genre, tag, rating and format with tap-through to Library; unknown-date exclusions must be stated. A pages-per-year/month chart exists but is optional and hidden until switched on. Out of v1: goals, sync, sharing, series-completion chart. See docs/BUILD_BRIEF.md.

## Brand Commitments

Name: Too Many Books. No logo or palette committed. Must not resemble Goodreads/StoryGraph, and must not feel like a corporate SaaS dashboard.

## Evidence on Hand

Docs only (docs/). No real library data, covers, or screenshots yet; demo content must be labeled synthetic.

## Product Principles

1. The reader's judgment is final: suggestions never overwrite, unknown stays unknown.
2. Backlog work should feel finishable, not like debt.
3. Adding a book is one quick act.
4. The library is the hero; chrome recedes.
5. Calm accounting, not pressure: no streak or gamified nudges.

## Accessibility & Inclusion

Not specified beyond touch-first iPad use; treat WCAG AA contrast as the baseline.
