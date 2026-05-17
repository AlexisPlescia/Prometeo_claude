import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminService, AdminProduct } from '../../services/adminService'
import { formatPrice } from '../../utils/formatPrice'

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect width='60' height='60' fill='%231a1a1a'/%3E%3C/svg%3E"
const PAGE_SIZE = 20

export default function AdminProductList() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<AdminProduct | null>(null)

  const load = (s?: string, p = 1) => {
    setLoading(true)
    setError(null)
    adminService.getProducts(s, p, PAGE_SIZE)
      .then(({ products: prods, total: t, totalPages: tp }) => {
        setProducts(prods)
        setTotal(t)
        setTotalPages(tp)
        setPage(p)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar los productos'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { document.title = 'Productos — Admin'; load() }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    load(search || undefined, 1)
  }

  const handleClearSearch = () => {
    setSearch('')
    load(undefined, 1)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await adminService.deleteProduct(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      setTotal((prev) => prev - 1)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setDeleting(null)
      setConfirmDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-widest text-white">PRODUCTOS</h1>
          {!loading && !error && (
            <p className="text-xs text-white/30 mt-1">{total} {total === 1 ? 'producto' : 'productos'} en total</p>
          )}
        </div>
        <Link to="/admin/products/new" className="px-4 py-2 bg-accent text-white text-sm rounded hover:bg-red-700 transition-colors">
          + Nuevo producto
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          className="flex-1 bg-[#0d0d10] border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="px-4 py-2 bg-white/10 text-white text-sm rounded hover:bg-white/15 transition-colors">
          Buscar
        </button>
        {search && (
          <button type="button" onClick={handleClearSearch} className="px-3 py-2 text-white/40 hover:text-white text-sm transition-colors">
            ✕
          </button>
        )}
      </form>

      {error && (
        <div className="flex items-center gap-3 bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3 text-sm text-red-400">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span>{error}</span>
          <button
            onClick={() => load(search || undefined, page)}
            className="ml-auto text-xs text-red-400/70 hover:text-red-400 underline transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="bg-[#0d0d10] border border-white/5 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-white/5">
            <tr className="text-white/30 text-xs">
              <th className="px-4 py-3 text-left font-normal">Imagen</th>
              <th className="px-4 py-3 text-left font-normal">Nombre</th>
              <th className="px-4 py-3 text-left font-normal">Categoría</th>
              <th className="px-4 py-3 text-right font-normal">Precio</th>
              <th className="px-4 py-3 text-right font-normal">Stock</th>
              <th className="px-4 py-3 text-center font-normal">Estado</th>
              <th className="px-4 py-3 text-right font-normal">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-white/5 animate-pulse">
                  {[...Array(7)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded" /></td>)}
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-white/20">
                  {error ? '' : 'No hay productos'}
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <img
                      src={p.images?.[0] || PLACEHOLDER}
                      alt={p.name}
                      className="w-10 h-10 object-cover rounded bg-white/5"
                      onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white/80 truncate max-w-[180px]">{p.name}</p>
                    <p className="text-white/30 text-xs">{p.brand}</p>
                  </td>
                  <td className="px-4 py-3 text-white/50 text-xs">{p.category?.name}</td>
                  <td className="px-4 py-3 text-right font-mono text-white/70">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className={p.stock === 0 ? 'text-red-400' : p.stock < 5 ? 'text-orange-400' : 'text-white/60'}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {p.onSale && <span className="px-1.5 py-0.5 bg-accent/20 text-accent text-xs rounded">OFERTA</span>}
                      {p.featured && <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">DEST.</span>}
                      {!p.onSale && !p.featured && <span className="text-white/20 text-xs">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/products/${p.id}/edit`}
                        className="text-xs text-white/50 hover:text-white transition-colors px-2 py-1 bg-white/5 rounded"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => setConfirmDelete(p)}
                        disabled={deleting === p.id}
                        className="text-xs text-red-400/60 hover:text-red-400 transition-colors px-2 py-1 bg-red-500/5 rounded"
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

      {/* Paginación */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/30">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => load(search || undefined, page - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs text-white/50 bg-white/5 rounded hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '…')[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('…')
                acc.push(p)
                return acc
              }, [])
              .map((item, i) =>
                item === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-3 py-1.5 text-xs text-white/20">…</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => load(search || undefined, item as number)}
                    className={`px-3 py-1.5 text-xs rounded transition-colors ${
                      item === page
                        ? 'bg-accent text-white'
                        : 'text-white/50 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
            <button
              onClick={() => load(search || undefined, page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs text-white/50 bg-white/5 rounded hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-[#111114] border border-white/10 rounded-lg p-6 max-w-sm w-full">
            <h3 className="font-semibold text-white mb-2">Eliminar producto</h3>
            <p className="text-sm text-white/50 mb-6">
              ¿Seguro que querés eliminar <strong className="text-white">{confirmDelete.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 bg-white/10 text-white text-sm rounded hover:bg-white/15 transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                disabled={deleting === confirmDelete.id}
                className="flex-1 py-2 bg-red-800 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                {deleting === confirmDelete.id ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
