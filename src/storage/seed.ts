import type { DatePart, Format, GenreId, Loan, Reading, Work } from '../types'

/**
 * Synthetic demo library. Titles are real books but every reading, rating,
 * date and loan below is invented. Flagged `synthetic` so it can be cleared.
 */
interface SeedReading {
  s: Reading['status']
  f: Format
  start?: DatePart
  fin?: DatePart
  r?: number
  note?: string
}
interface SeedEntry {
  t: string
  a: string
  g: GenreId[]
  tags?: string[]
  series?: [string, number]
  pp?: number
  want?: boolean
  reads?: SeedReading[]
  loan?: [DatePart, Format]
}

const E: SeedEntry[] = [
  { t: 'Project Hail Mary', a: 'Andy Weir', g: ['scifi'], tags: ['first contact', 'science-y'], pp: 476,
    reads: [{ s: 'finished', f: 'ebook', fin: { y: 2022 }, r: 4.5 }, { s: 'finished', f: 'audiobook', start: { y: 2026, m: 8, d: 3 }, fin: { y: 2026, m: 9, d: 12 }, r: 5, note: 'Second time through and the audiobook lands even harder.' }],
    loan: [{ y: 2026, m: 8 }, 'audiobook'] },
  { t: 'Piranesi', a: 'Susanna Clarke', g: ['fantasy', 'literary'], tags: ['strange'], pp: 272, reads: [{ s: 'finished', f: 'ebook', fin: { y: 2026, m: 8 }, r: 4.5 }], loan: [{ y: 2026, m: 7 }, 'ebook'] },
  { t: 'Wolf Hall', a: 'Hilary Mantel', g: ['historical'], series: ['Thomas Cromwell', 1], pp: 604, reads: [{ s: 'finished', f: 'print', fin: { y: 2026, m: 7 }, r: 4 }] },
  { t: 'Bring Up the Bodies', a: 'Hilary Mantel', g: ['historical'], series: ['Thomas Cromwell', 2], pp: 432, reads: [{ s: 'reading', f: 'print', start: { y: 2026, m: 9, d: 14 } }] },
  { t: 'Leviathan Wakes', a: 'James S. A. Corey', g: ['scifi'], series: ['The Expanse', 1], pp: 592, reads: [{ s: 'finished', f: 'audiobook', fin: { y: 2025 } }] },
  { t: 'Caliban’s War', a: 'James S. A. Corey', g: ['scifi'], series: ['The Expanse', 2], pp: 595, want: true },
  { t: 'The Left Hand of Darkness', a: 'Ursula K. Le Guin', g: ['scifi', 'literary'], pp: 304, reads: [{ s: 'finished', f: 'ebook', r: 4 }] },
  { t: 'Circe', a: 'Madeline Miller', g: ['fantasy', 'historical'], tags: ['myth'], pp: 393, reads: [{ s: 'finished', f: 'ebook', fin: { y: 2026, m: 3 }, r: 5 }] },
  { t: 'Neuromancer', a: 'William Gibson', g: ['scifi'], pp: 271, reads: [{ s: 'dnf', f: 'print', fin: { y: 2026, m: 2 }, r: 2, note: 'Stopped a third in. The prose fights me.' }] },
  { t: 'The Goblin Emperor', a: 'Katherine Addison', g: ['fantasy'], tags: ['cozy', 'court intrigue'], pp: 446, reads: [{ s: 'finished', f: 'ebook', fin: { y: 2026, m: 1 }, r: 4.5 }] },
  { t: 'Hamnet', a: 'Maggie O’Farrell', g: ['historical', 'literary'], pp: 305, reads: [{ s: 'finished', f: 'print', fin: { y: 2025, m: 12 }, r: 4 }] },
  { t: 'The Lies of Locke Lamora', a: 'Scott Lynch', g: ['fantasy'], series: ['Gentleman Bastard', 1], tags: ['heist'], pp: 499, reads: [{ s: 'finished', f: 'audiobook', fin: { y: 2025, m: 11 }, r: 4.5 }] },
  { t: 'Red Seas Under Red Skies', a: 'Scott Lynch', g: ['fantasy'], series: ['Gentleman Bastard', 2], pp: 592, want: true },
  { t: 'The Thursday Murder Club', a: 'Richard Osman', g: ['mystery'], tags: ['cozy'], pp: 382, reads: [{ s: 'finished', f: 'audiobook', fin: { y: 2025, m: 10 }, r: 3.5 }] },
  { t: 'Gone Girl', a: 'Gillian Flynn', g: ['mystery'], pp: 415, reads: [{ s: 'finished', f: 'ebook', fin: { y: 2025, m: 9 }, r: 3 }] },
  { t: 'Tomorrow, and Tomorrow, and Tomorrow', a: 'Gabrielle Zevin', g: ['literary'], pp: 416, reads: [{ s: 'finished', f: 'ebook', fin: { y: 2025, m: 8, d: 20 }, r: 4.5 }] },
  { t: 'Beach Read', a: 'Emily Henry', g: ['romance'], pp: 361, reads: [{ s: 'finished', f: 'ebook', fin: { y: 2025, m: 7 }, r: 3.5 }] },
  { t: 'The Seven Husbands of Evelyn Hugo', a: 'Taylor Jenkins Reid', g: ['romance', 'historical'], pp: 388, reads: [{ s: 'finished', f: 'audiobook', fin: { y: 2025, m: 6 }, r: 4.5 }] },
  { t: 'Sapiens', a: 'Yuval Noah Harari', g: ['nonfiction'], pp: 464, reads: [{ s: 'dnf', f: 'audiobook', fin: { y: 2025, m: 5 } }] },
  { t: 'The Soul of an Octopus', a: 'Sy Montgomery', g: ['nonfiction'], tags: ['nature'], pp: 261, reads: [{ s: 'finished', f: 'print', fin: { y: 2025, m: 4 }, r: 4 }] },
  { t: 'Braiding Sweetgrass', a: 'Robin Wall Kimmerer', g: ['nonfiction'], tags: ['nature'], pp: 391, reads: [{ s: 'finished', f: 'print', fin: { y: 2025, m: 3 }, r: 5 }] },
  { t: 'Dune', a: 'Frank Herbert', g: ['scifi'], series: ['Dune', 1], pp: 688, reads: [{ s: 'finished', f: 'audiobook', fin: { y: 2024 }, r: 4 }] },
  { t: 'Station Eleven', a: 'Emily St. John Mandel', g: ['scifi', 'literary'], pp: 333, reads: [{ s: 'finished', f: 'ebook', fin: { y: 2024, m: 6 }, r: 4.5 }] },
  { t: 'The Name of the Wind', a: 'Patrick Rothfuss', g: ['fantasy'], series: ['Kingkiller Chronicle', 1], pp: 662, reads: [{ s: 'finished', f: 'print', fin: { y: 2023 }, r: 3.5 }] },
  { t: 'Rebecca', a: 'Daphne du Maurier', g: ['mystery', 'literary'], pp: 380, want: true },
  { t: 'Pachinko', a: 'Min Jin Lee', g: ['historical', 'literary'], pp: 496, want: true },
  { t: 'The Long Way to a Small, Angry Planet', a: 'Becky Chambers', g: ['scifi'], series: ['Wayfarers', 1], tags: ['found family', 'cozy'], pp: 404, reads: [{ s: 'finished', f: 'audiobook', fin: { y: 2024, m: 2 }, r: 4 }] },
  { t: 'A Psalm for the Wild-Built', a: 'Becky Chambers', g: ['scifi'], series: ['Monk & Robot', 1], tags: ['found family', 'cozy'], pp: 160, reads: [{ s: 'finished', f: 'ebook', fin: { y: 2024, m: 1 }, r: 5 }] },
]

export function buildSeed(): { work: Work; readings: Omit<Reading, 'workId'>[]; loan?: Omit<Loan, 'workId'> }[] {
  return E.map((e) => ({
    work: {
      title: e.t,
      author: e.a,
      genres: e.g,
      tags: e.tags ?? [],
      series: e.series ? { name: e.series[0], position: e.series[1] } : undefined,
      pageCount: e.pp,
      shelves: e.want ? ['want'] : [],
      synthetic: true,
    },
    readings: (e.reads ?? []).map((r) => ({
      status: r.s, format: r.f, start: r.start, finish: r.fin, rating: r.r, review: r.note,
    })),
    loan: e.loan ? { source: 'libby' as const, borrowed: e.loan[0], library: 'Sample County Library', format: e.loan[1] } : undefined,
  }))
}
