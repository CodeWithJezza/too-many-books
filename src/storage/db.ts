import Dexie, { type EntityTable } from 'dexie'
import { bumpChanges } from '../backup/changes'
import type { MetadataHit } from '../metadata/types'
import type { GoodreadsRecord, ImportRecord, ImportRun, Loan, Reading, Work } from '../types'

export interface CachedSearch {
  query: string
  hits: MetadataHit[]
  at: number
}

export class LibraryDB extends Dexie {
  works!: EntityTable<Work, 'id'>
  readings!: EntityTable<Reading, 'id'>
  loans!: EntityTable<Loan, 'id'>
  metadata!: EntityTable<CachedSearch, 'query'>
  importRecords!: EntityTable<ImportRecord, 'id'>
  imports!: EntityTable<ImportRun, 'id'>
  grRecords!: EntityTable<GoodreadsRecord, 'id'>

  constructor(name = 'too-many-books') {
    super(name)
    this.version(1).stores({
      works: '++id, title, author',
      readings: '++id, workId, status',
      loans: '++id, workId',
    })
    this.version(2).stores({ metadata: 'query' })
    this.version(3).stores({ importRecords: '++id, &key, state, titleId', imports: '++id' })
    this.version(4).stores({ grRecords: '++id, &bookId, state' })
    for (const t of [this.works, this.readings, this.loans, this.importRecords, this.grRecords]) {
      t.hook('creating', () => void bumpChanges())
      t.hook('updating', () => void bumpChanges())
      t.hook('deleting', () => void bumpChanges())
    }
  }
}
