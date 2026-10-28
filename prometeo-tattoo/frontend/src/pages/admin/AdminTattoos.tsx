import { useEffect, useRef, useState } from 'react'
import { tattooService, tattooImageUrl, TattooWork, TattooFields } from '../../services/tattooService'

const inputClass =
  'w-full bg-[#070709] border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-accent'

export default function AdminTattoos() {
  const [works, setWorks] = useState<TattooWork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [batch, setBatch] = useState({ artist: '', style: '' })
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.title = 'Tatuajes — Admin'
    tattooService
      .list()
      .then(setWorks)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar la galería'))
      .finally(() => setLoading(false))
  }, [])

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setError('')
    const list = Array.from(files)
    setProgress({ done: 0, total: list.length })
    const failed: string[] = []
    // De a una: cada foto ya pesa ~1 MB en base64 y el plan free de Render es chico
    for (const file of list) {
      try {
        const created = await tattooService.upload(file, {
          artist: batch.artist.trim() || undefined,
          style: batch.style.trim() || undefined,
        })
        setWorks((prev) => [created, ...prev])
      } catch (err) {
        failed.push(`${file.name}: ${err instanceof Error ? err.message : 'error'}`)
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p))
    }
    setProgress(null)
    if (failed.length) setError(`No se pudieron subir ${failed.length} foto(s):\n${failed.join('\n')}`)
    if (fileInput.current) fileInput.current.value = ''
  }

  const saveField = async (work: TattooWork, field: keyof TattooFields, value: string) => {
    const next = value.trim() || null
    if (next === work[field]) return
    try {
      const updated = await tattooService.update(work.id, { [field]: next })
      setWorks((prev) => prev.map((w) => (w.id === work.id ? updated : w)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const move = async (index: number, delta: -1 | 1) => {
    const target = index + delta
    if (target < 0 || target >= works.length) return
    const reordered = [...works]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    setWorks(reordered)
    try {
      // Renumerar las dos que cambian según su nuevo lugar en la lista
      await Promise.all([
        tattooService.update(reordered[index].id, { position: index }),
        tattooService.update(reordered[target].id, { position: target }),
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reordenar')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta foto de la galería?')) return
    try {
      await tattooService.remove(id)
      setWorks((prev) => prev.filter((w) => w.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-2xl tracking-widest text-white">TATUAJES</h1>
        <a href="/tatuajes" target="_blank" rel="noreferrer" className="text-xs text-white/40 hover:text-white underline">
          Ver galería pública
        </a>
      </div>

      <div className="bg-[#0d0d10] border border-white/5 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white/60">Subir fotos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/40 mb-1">Artista (opcional, para todas las que subas)</label>
            <input className={inputClass} value={batch.artist} onChange={(e) => setBatch((b) => ({ ...b, artist: e.target.value }))} placeholder="Ej: Alexis" />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">Estilo (opcional, para todas las que subas)</label>
            <input className={inputClass} value={batch.style} onChange={(e) => setBatch((b) => ({ ...b, style: e.target.value }))} placeholder="Ej: Blackwork, Realismo, Tradicional" />
          </div>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          disabled={!!progress}
          onChange={(e) => handleFiles(e.target.files)}
          className="block w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-accent file:text-white hover:file:bg-red-700 file:cursor-pointer disabled:opacity-50"
        />
        {progress && <p className="text-xs text-white/50">Subiendo {progress.done + 1} de {progress.total}…</p>}
        <p className="text-xs text-white/30">Podés elegir varias a la vez. Se achican solas antes de subir; las nuevas quedan primeras.</p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded px-3 py-2 text-xs text-red-400 whitespace-pre-line">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="aspect-square bg-white/5 rounded animate-pulse" />)}
        </div>
      ) : works.length === 0 ? (
        <p className="text-center text-white/20 py-12">Todavía no hay fotos en la galería</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {works.map((w, i) => (
            <div key={w.id} className="bg-[#0d0d10] border border-white/5 rounded-lg overflow-hidden">
              <img src={tattooImageUrl(w.id)} alt={w.title || 'Tatuaje'} loading="lazy" className="w-full aspect-square object-cover" />
              <div className="p-2 space-y-1.5">
                {(['title', 'artist', 'style'] as const).map((field) => (
                  <input
                    key={field}
                    className={inputClass}
                    defaultValue={w[field] ?? ''}
                    placeholder={{ title: 'Título', artist: 'Artista', style: 'Estilo' }[field]}
                    onBlur={(e) => saveField(w, field, e.target.value)}
                  />
                ))}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex gap-1">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="text-xs text-white/50 hover:text-white px-2 py-1 bg-white/5 rounded disabled:opacity-30" aria-label="Mover antes">←</button>
                    <button onClick={() => move(i, 1)} disabled={i === works.length - 1} className="text-xs text-white/50 hover:text-white px-2 py-1 bg-white/5 rounded disabled:opacity-30" aria-label="Mover después">→</button>
                  </div>
                  <button onClick={() => handleDelete(w.id)} className="text-xs text-red-400/60 hover:text-red-400 px-2 py-1 bg-red-500/5 rounded">Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
