export function Placeholder({ title, blurb }: { title: string; blurb: string }) {
  return (
    <main className="library">
      <div className="lib-head"><h1>{title}</h1></div>
      <div className="state">
        <p className="state-title">Not built yet</p>
        <p>{blurb}</p>
      </div>
    </main>
  )
}
