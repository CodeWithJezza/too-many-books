import type { Loan, Reading, Work } from '../types'
import type { YearFilter } from './stats'

export interface LoanStats {
  /** Years that have at least one dated Loan, newest first. */
  years: number[]
  loanCount: number
  /** Loans with no borrow date. Left out of every year and month view. */
  undated: number
  perYear: { year: number; count: number }[]
  /** Year the month chart shows: the selected year, else the latest with Loans. */
  monthYear?: number
  perMonth: number[]
  /** Borrowed in monthYear but recorded only to the year. */
  monthUnknown: number
  libraries: { library: string; count: number }[]
  /** Loans that do not name a library. */
  noLibrary: number
  /** Finished Readings in the filter: tied to a Loan, or with no Loan recorded. */
  borrowed: number
  noLoan: number
  /** Of noLoan: the Work has Loans, but none is tied to this Reading. */
  unlinked: number
  /** Works with Loans and no finished Reading, whatever the year filter. */
  notFinished: { id: number; title: string; author: string; loans: number }[]
}

/**
 * Loans are counted as Loans, not Readings: a borrow is evidence of borrowing. A Reading
 * is "borrowed" only when a Loan is tied to it; no Loan recorded does not mean owned.
 */
export function computeLoanStats(loans: Loan[], readings: Reading[], works: Work[], filter: YearFilter): LoanStats {
  const years = [...new Set(loans.map((l) => l.borrowed?.y).filter((y): y is number => y !== undefined))].sort((a, b) => b - a)
  const inYear = (l: Loan) => filter === 'all' || l.borrowed?.y === filter
  const shown = loans.filter(inYear)
  const monthYear = filter === 'all' ? years[0] : filter
  const perMonth = Array.from({ length: 12 }, () => 0)
  let monthUnknown = 0
  for (const l of loans.filter((l) => monthYear !== undefined && l.borrowed?.y === monthYear)) {
    if (l.borrowed?.m) perMonth[l.borrowed.m - 1]++
    else monthUnknown++
  }

  const libs = new Map<string, number>()
  for (const l of shown) if (l.library) libs.set(l.library, (libs.get(l.library) ?? 0) + 1)

  const finished = readings.filter((r) => r.status === 'finished' && (filter === 'all' || r.finish?.y === filter))
  const linked = new Set(loans.map((l) => l.readingId).filter((x): x is number => x !== undefined))
  const workHasLoan = new Set(loans.map((l) => l.workId))
  const borrowedReadings = finished.filter((r) => r.id !== undefined && linked.has(r.id))
  const rest = finished.filter((r) => !borrowedReadings.includes(r))

  const finishedWorks = new Set(readings.filter((r) => r.status === 'finished').map((r) => r.workId))
  const loanCount = new Map<number, number>()
  for (const l of loans) loanCount.set(l.workId, (loanCount.get(l.workId) ?? 0) + 1)
  const byId = new Map(works.map((w) => [w.id!, w]))

  return {
    years,
    loanCount: shown.length,
    undated: loans.filter((l) => !l.borrowed).length,
    perYear: [...years].reverse().map((year) => ({ year, count: loans.filter((l) => l.borrowed?.y === year).length })),
    monthYear,
    perMonth,
    monthUnknown,
    libraries: [...libs].map(([library, count]) => ({ library, count })).sort((a, b) => b.count - a.count || a.library.localeCompare(b.library)).slice(0, 10),
    noLibrary: shown.filter((l) => !l.library).length,
    borrowed: borrowedReadings.length,
    noLoan: rest.length,
    unlinked: rest.filter((r) => workHasLoan.has(r.workId)).length,
    notFinished: [...loanCount]
      .filter(([id]) => !finishedWorks.has(id) && byId.has(id))
      .map(([id, n]) => ({ id, title: byId.get(id)!.title, author: byId.get(id)!.author, loans: n }))
      .sort((a, b) => a.title.localeCompare(b.title)),
  }
}
