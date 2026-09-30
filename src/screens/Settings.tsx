import { useEffect, useRef, useState } from 'react'
import { BackupFormatError, backupFileName, createBackup, markBackedUp, readingsCsv, restoreBackup, validateBackup, type BackupFile, type BackupSummary } from '../backup/backup'
import { changesSinceBackup, lastBackupAt, subscribeChanges } from '../backup/changes'
import { isAppleTouch, isInstalled } from '../pwa'
import { db } from '../storage'
import { useSyncExternalStore } from 'react'

function download(name: string, data: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

const when = (ms?: number) =>
  ms ? new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'never'

export function Settings() {
  const changes = useSyncExternalStore(subscribeChanges, changesSinceBackup)
  const backedUp = useSyncExternalStore(subscribeChanges, () => lastBackupAt() ?? 0)
  const [persisted, setPersisted] = useState<boolean | undefined>()
  const [pending, setPending] = useState<{ file: BackupFile; summary: BackupSummary } | undefined>()
  const [current, setCurrent] = useState<{ works: number; readings: number }>({ works: 0, readings: 0 })
  const [msg, setMsg] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(undefined))
  }, [])

  async function backup() {
    setError(undefined)
    try {
      download(backupFileName(), JSON.stringify(await createBackup(db)), 'application/json')
      markBackedUp()
      setMsg('Backup downloaded. Keep the file somewhere safe, such as iCloud Drive.')
    } catch {
      setError('Could not create the backup. Nothing was changed.')
    }
  }

  async function csv() {
    setError(undefined)
    const [works, readings] = await Promise.all([db.works.toArray(), db.readings.toArray()])
    download('too-many-books-readings.csv', readingsCsv(works, readings), 'text/csv;charset=utf-8')
    setMsg('Reading history exported as a spreadsheet. It is one-way and cannot be imported back.')
  }

  async function choose(f: File | undefined) {
    if (!f) return
    setError(undefined)
    setMsg(undefined)
    setPending(undefined)
    try {
      setPending(validateBackup(JSON.parse(await f.text()) as unknown))
      setCurrent({ works: await db.works.count(), readings: await db.readings.count() })
    } catch (e) {
      setError(e instanceof BackupFormatError ? e.message : e instanceof SyntaxError ? 'That file is not valid JSON, so it cannot be a backup.' : 'Could not read that file.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function replace() {
    if (!pending) return
    setBusy(true)
    setError(undefined)
    try {
      await restoreBackup(db, pending.file)
      setMsg(`Restored ${pending.summary.works} books and ${pending.summary.readings} readings. Your previous library was replaced.`)
      setPending(undefined)
    } catch {
      setError('The restore failed and your current library was left untouched.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="library settings">
      <div className="lib-head"><h1>Settings</h1></div>

      <section className="set-section" aria-labelledby="bk">
        <h2 id="bk" className="set-title">Back up</h2>
        <p>Your library lives only on this device. Download a backup file regularly, because there is no copy on a server.</p>
        <p className="hint">Last backup: {when(backedUp || undefined)}. {changes > 0 ? `${changes} ${changes === 1 ? 'change' : 'changes'} since.` : 'No changes since.'}</p>
        <p className="hint">{isInstalled() ? 'Installed on this device.' : isAppleTouch() ? 'Not installed yet. Open the Share menu in Safari and choose Add to Home Screen.' : 'Not installed. Your browser can install it from its address bar or menu.'}</p>
        {persisted === false && <p className="hint">This browser has not promised to keep the data. Installing the app to your Home Screen makes that more likely, and backups cover the rest.</p>}
        <div className="form-actions">
          <button type="button" className="btn-primary" onClick={() => void backup()}>Download backup</button>
          <button type="button" className="btn-quiet" onClick={() => void csv()}>Export reading history (CSV)</button>
        </div>
      </section>

      <section className="set-section" aria-labelledby="rs">
        <h2 id="rs" className="set-title">Restore</h2>
        <p>Restoring replaces your whole library with the backup. It does not merge.</p>
        <div className="form-actions">
          <label className="btn-quiet file-btn">
            Choose a backup file
            <input ref={fileRef} type="file" accept=".json,application/json" className="sr-only" onChange={(e) => void choose(e.target.files?.[0])} />
          </label>
        </div>

        {pending && (
          <div className="confirm" role="alertdialog" aria-labelledby="cf">
            <p id="cf" className="confirm-title">Replace your library with this backup?</p>
            <p>The backup{pending.summary.exportedAt ? ` from ${when(Date.parse(pending.summary.exportedAt))}` : ''} has {pending.summary.works} books, {pending.summary.readings} readings, {pending.summary.loans} loans and {pending.summary.importRecords} import records.</p>
            <p>You have {current.works} books and {current.readings} readings now. They will be gone after this.</p>
            <div className="form-actions">
              <button type="button" className="btn-danger" disabled={busy} onClick={() => void replace()}>{busy ? 'Restoring…' : 'Replace my library'}</button>
              <button type="button" className="btn-quiet" disabled={busy} onClick={() => setPending(undefined)}>Cancel</button>
            </div>
          </div>
        )}
      </section>

      {msg && <p className="ib-summary" role="status">{msg}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </main>
  )
}
