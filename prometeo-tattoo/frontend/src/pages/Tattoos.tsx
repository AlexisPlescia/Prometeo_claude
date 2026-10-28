import { useEffect, useMemo, useState } from 'react'
import { tattooService, tattooImageUrl, TattooWork } from '../services/tattooService'

const ALL = 'Todos'

export default function Tattoos() {
  const [works, setWorks] = useState<TattooWork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [style, setStyle] = useState(ALL)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    document.title = 'Tatuajes — Prometeo Tattoo'
    tattooService
      .list()
      .then(setWorks)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la galería'))
      .finally(() => setLoading(false))
  }, [])

  const styles = useMemo(
    () => [ALL, ...Array.from(new Set(works.map((w) => w.style).filter((s): s is string => !!s))).sort()],
    [works],
  )
  const visible = style === ALL ? works : works.filter((w) => w.style === style)
  const open = openIndex !== null ? visible[openIndex] : null

  useEffect(() => {
    if (openIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenIndex(null)
      if (e.key === 'ArrowRight') setOpenIndex((i) => (i === null ? i : (i + 1) % visible.length))
      if (e.key === 'ArrowLeft') setOpenIndex((i) => (i === null ? i : (i - 1 + visible.length) % visible.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openIndex, visible.length])

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="font-mono text-gold/60 text-xs tracking-[0.3em] uppercase mb-2">Nuestro trabajo</p>
          <h1 className="section-title">Tatuajes</h1>
        </div>

        {styles.length > 2 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {styles.map((s) => (
              <button
                key={s}
                onClick={() => { setStyle(s); setOpenIndex(null) }}
                className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                  style === s ? 'bg-accent border-accent text-white' : 'border-white/15 text-white/60 hover:text-white hover:border-white/30'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/5] bg-white/5 rounded-lg animate-pulse" />)}
          </div>
        ) : error ? (
          <p className="text-red-400 text-sm">{error}</p>
        ) : visible.length === 0 ? (
          <p className="text-white/40 text-center py-20">Muy pronto vas a ver acá los trabajos del estudio.</p>
        ) : (
          <div className="columns-2 md:columns-3 gap-3 [&>*]:mb-3">
            {visible.map((w, i) => (
              <button
                key={w.id}
                onClick={() => setOpenIndex(i)}
                className="group relative block w-full overflow-hidden rounded-lg break-inside-avoid focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <img
                  src={tattooImageUrl(w.id)}
                  alt={w.title || `Tatuaje${w.style ? ` ${w.style}` : ''}`}
                  loading="lazy"
                  className="w-full h-auto transition-transform duration-300 group-hover:scale-[1.03]"
                />
                {(w.title || w.artist) && (
                  <div className="absolute inset-x-0 bottom-0 p-3 text-left bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    {w.title && <p className="text-white text-sm font-medium">{w.title}</p>}
                    {w.artist && <p className="text-white/60 text-xs">por {w.artist}</p>}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setOpenIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          <button className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none" aria-label="Cerrar">×</button>
          {visible.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setOpenIndex((openIndex! - 1 + visible.length) % visible.length) }}
                className="absolute left-2 md:left-6 text-white/60 hover:text-white text-4xl px-2"
                aria-label="Anterior"
              >‹</button>
              <button
                onClick={(e) => { e.stopPropagation(); setOpenIndex((openIndex! + 1) % visible.length) }}
                className="absolute right-2 md:right-6 text-white/60 hover:text-white text-4xl px-2"
                aria-label="Siguiente"
              >›</button>
            </>
          )}
          <figure className="max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <img src={tattooImageUrl(open.id)} alt={open.title || 'Tatuaje'} className="max-h-[80vh] w-auto mx-auto rounded" />
            {(open.title || open.artist || open.style) && (
              <figcaption className="text-center mt-3 text-sm text-white/70">
                {[open.title, open.artist && `por ${open.artist}`, open.style].filter(Boolean).join(' · ')}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </div>
  )
}
