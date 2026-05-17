import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminService, AdminCategory } from '../../services/adminService'

interface FormData {
  name: string
  description: string
  price: string
  comparePrice: string
  stock: string
  categoryId: string
  brand: string
  images: string
  featured: boolean
  onSale: boolean
}

const EMPTY: FormData = {
  name: '', description: '', price: '', comparePrice: '', stock: '',
  categoryId: '', brand: '', images: '', featured: false, onSale: false,
}

export default function AdminProductForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState<FormData>(EMPTY)
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    document.title = isEdit ? 'Editar producto — Admin' : 'Nuevo producto — Admin'
    adminService.getCategories().then(setCategories).catch(console.error)

    if (isEdit && id) {
      adminService.getProduct(id).then((product) => {
        setForm({
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          comparePrice: product.comparePrice?.toString() || '',
          stock: product.stock.toString(),
          categoryId: product.categoryId,
          brand: product.brand,
          images: product.images.join('\n'),
          featured: product.featured,
          onSale: product.onSale,
        })
      }).catch(() => setError('No se pudo cargar el producto'))
    }
  }, [id, isEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.name || !form.description || !form.price || !form.stock || !form.categoryId || !form.brand) {
      setError('Completá todos los campos requeridos')
      return
    }

    const price = parseFloat(form.price)
    const stock = parseInt(form.stock)
    if (isNaN(price) || price <= 0) { setError('Precio inválido'); return }
    if (isNaN(stock) || stock < 0) { setError('Stock inválido'); return }

    const imagesArr = form.images
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
      stock,
      categoryId: form.categoryId,
      brand: form.brand.trim(),
      images: imagesArr,
      featured: form.featured,
      onSale: form.onSale,
    }

    setLoading(true)
    try {
      if (isEdit && id) {
        await adminService.updateProduct(id, payload)
        setSuccess('Producto actualizado correctamente')
      } else {
        await adminService.createProduct(payload)
        setSuccess('Producto creado correctamente')
        setTimeout(() => navigate('/admin/products'), 1200)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const set = (field: keyof FormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/products')} className="text-white/40 hover:text-white transition-colors text-sm">
          ← Volver
        </button>
        <h1 className="font-display text-2xl tracking-widest text-white">
          {isEdit ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#0d0d10] border border-white/5 rounded-lg p-6 space-y-5">
        {error && <div className="bg-red-900/20 border border-red-800/30 rounded px-4 py-2 text-sm text-red-400">{error}</div>}
        {success && <div className="bg-green-900/20 border border-green-800/30 rounded px-4 py-2 text-sm text-green-400">{success}</div>}

        <Field label="Nombre *">
          <input className="input-admin" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </Field>

        <Field label="Descripción *">
          <textarea className="input-admin resize-none h-28" value={form.description} onChange={(e) => set('description', e.target.value)} required />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Precio ARS *">
            <input className="input-admin" type="number" min="0" step="1" value={form.price} onChange={(e) => set('price', e.target.value)} required />
          </Field>
          <Field label="Precio comparación (tachado)">
            <input className="input-admin" type="number" min="0" step="1" value={form.comparePrice} onChange={(e) => set('comparePrice', e.target.value)} placeholder="Opcional" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Stock *">
            <input className="input-admin" type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} required />
          </Field>
          <Field label="Marca *">
            <input className="input-admin" value={form.brand} onChange={(e) => set('brand', e.target.value)} required />
          </Field>
        </div>

        <Field label="Categoría *">
          <select className="input-admin" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} required>
            <option value="">Seleccioná una categoría</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>

        <Field label="URLs de imágenes (una por línea)">
          <textarea
            className="input-admin resize-none h-24 font-mono text-xs"
            value={form.images}
            onChange={(e) => set('images', e.target.value)}
            placeholder="https://ejemplo.com/imagen1.jpg&#10;https://ejemplo.com/imagen2.jpg"
          />
          <p className="text-xs text-white/30 mt-1">Pegá URLs de imágenes, una por línea</p>
        </Field>

        {form.images && (
          <div className="flex gap-2 flex-wrap">
            {form.images.split('\n').filter(Boolean).map((url, i) => (
              <img key={i} src={url.trim()} alt="" className="w-16 h-16 object-cover rounded border border-white/10" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ))}
          </div>
        )}

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-accent" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
            <span className="text-sm text-white/60">Producto destacado</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-accent" checked={form.onSale} onChange={(e) => set('onSale', e.target.checked)} />
            <span className="text-sm text-white/60">En oferta</span>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate('/admin/products')} className="px-4 py-2 bg-white/10 text-white text-sm rounded hover:bg-white/15 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="px-6 py-2 bg-accent text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50">
            {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </form>

      <style>{`
        .input-admin {
          width: 100%;
          background: #070709;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          padding: 8px 12px;
          color: #e8e8e8;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-admin:focus { border-color: #c62828; }
        .input-admin option { background: #0d0d10; }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
