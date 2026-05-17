import { useEffect, useState } from 'react'
import { adminService, AdminCategory } from '../../services/adminService'

export default function AdminCategoryList() {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', image: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [loadError, setLoadError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setLoadError(null)
    adminService.getCategories()
      .then(setCategories)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Error al cargar las categorías'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { document.title = 'Categorías — Admin'; load() }, [])

  const handleSave = async () => {
    if (!form.name.trim()) { setError('El nombre es requerido'); return }
    setError('')
    setSaving(true)
    try {
      if (editId) {
        const updated = await adminService.updateCategory(editId, { name: form.name, image: form.image || undefined })
        setCategories((prev) => prev.map((c) => (c.id === editId ? { ...updated, _count: c._count } : c)))
      } else {
        const created = await adminService.createCategory({ name: form.name, image: form.image || undefined })
        setCategories((prev) => [...prev, { ...created, _count: { products: 0 } }])
      }
      setForm({ name: '', image: '' })
      setEditId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (cat: AdminCategory) => {
    setEditId(cat.id)
    setForm({ name: cat.name, image: cat.image || '' })
    setError('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return
    try {
      await adminService.deleteCategory(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-display text-2xl tracking-widest text-white">CATEGORÍAS</h1>

      {loadError && (
        <div className="flex items-center gap-3 bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3 text-sm text-red-400">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span>{loadError}</span>
          <button onClick={load} className="ml-auto text-xs text-red-400/70 hover:text-red-400 underline transition-colors">Reintentar</button>
        </div>
      )}

      {/* Form */}
      <div className="bg-[#0d0d10] border border-white/5 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-white/60 mb-4">
          {editId ? 'Editar categoría' : 'Nueva categoría'}
        </h2>
        {error && <div className="bg-red-900/20 border border-red-800/30 rounded px-3 py-2 text-xs text-red-400 mb-3">{error}</div>}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-white/40 mb-1">Nombre *</label>
            <input
              className="w-full bg-[#070709] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nombre de la categoría"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-white/40 mb-1">URL imagen (opcional)</label>
            <input
              className="w-full bg-[#070709] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
              value={form.image}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-accent text-white text-sm rounded hover:bg-red-700 transition-colors whitespace-nowrap disabled:opacity-50">
            {saving ? '...' : editId ? 'Guardar' : 'Crear'}
          </button>
          {editId && (
            <button onClick={() => { setEditId(null); setForm({ name: '', image: '' }); setError('') }} className="px-3 py-2 bg-white/10 text-white/60 text-sm rounded hover:bg-white/15 transition-colors">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-[#0d0d10] border border-white/5 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-white/5">
            <tr className="text-white/30 text-xs">
              <th className="px-4 py-3 text-left font-normal">Nombre</th>
              <th className="px-4 py-3 text-left font-normal">Slug</th>
              <th className="px-4 py-3 text-right font-normal">Productos</th>
              <th className="px-4 py-3 text-right font-normal">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b border-white/5 animate-pulse">
                  {[...Array(4)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded" /></td>)}
                </tr>
              ))
            ) : categories.length === 0 ? (
              <tr><td colSpan={4} className="py-8 text-center text-white/20">No hay categorías</td></tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 text-white/80">{cat.name}</td>
                  <td className="px-4 py-3 text-white/30 font-mono text-xs">{cat.slug}</td>
                  <td className="px-4 py-3 text-right text-white/50">{cat._count.products}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(cat)} className="text-xs text-white/50 hover:text-white px-2 py-1 bg-white/5 rounded transition-colors">
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        disabled={cat._count.products > 0}
                        className="text-xs text-red-400/60 hover:text-red-400 px-2 py-1 bg-red-500/5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={cat._count.products > 0 ? 'Tiene productos asociados' : ''}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
