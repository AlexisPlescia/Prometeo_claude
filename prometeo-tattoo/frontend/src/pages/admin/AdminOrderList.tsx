import { useEffect, useState } from 'react'
import { adminService, AdminOrder } from '../../services/adminService'
import { formatPrice } from '../../utils/formatPrice'

const STATUSES = ['', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente', CONFIRMED: 'Confirmado', SHIPPED: 'Enviado', DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
}
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  CONFIRMED: 'bg-blue-500/20 text-blue-400',
  SHIPPED: 'bg-purple-500/20 text-purple-400',
  DELIVERED: 'bg-green-500/20 text-green-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
}
const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED']
const NEXT_STATUS: Record<string, string> = {
  PENDING: 'CONFIRMED', CONFIRMED: 'SHIPPED', SHIPPED: 'DELIVERED',
}
const NEXT_LABEL: Record<string, string> = {
  PENDING: 'Confirmar', CONFIRMED: 'Marcar enviado', SHIPPED: 'Marcar entregado',
}

export default function AdminOrderList() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const load = (status?: string) => {
    setLoading(true)
    setError(null)
    adminService.getOrders(status || undefined)
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar las órdenes'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { document.title = 'Órdenes — Admin'; load() }, [])

  const handleFilter = (status: string) => {
    setFilter(status)
    load(status || undefined)
  }

  const handleAdvance = async (order: AdminOrder) => {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    setUpdating(order.id)
    try {
      const updated = await adminService.updateOrderStatus(order.id, next)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: updated.status } : o)))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl tracking-widest text-white">ÓRDENES</h1>

      {error && (
        <div className="flex items-center gap-3 bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3 text-sm text-red-400">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span>{error}</span>
          <button onClick={() => load(filter || undefined)} className="ml-auto text-xs text-red-400/70 hover:text-red-400 underline transition-colors">Reintentar</button>
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => handleFilter(s)}
            className={`px-3 py-1.5 rounded text-xs transition-colors ${filter === s ? 'bg-accent text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
          >
            {s ? STATUS_LABELS[s] : 'Todas'}
          </button>
        ))}
      </div>

      <div className="bg-[#0d0d10] border border-white/5 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-white/5">
            <tr className="text-white/30 text-xs">
              <th className="px-4 py-3 text-left font-normal">#</th>
              <th className="px-4 py-3 text-left font-normal">Fecha</th>
              <th className="px-4 py-3 text-left font-normal">Cliente</th>
              <th className="px-4 py-3 text-right font-normal">Total</th>
              <th className="px-4 py-3 text-center font-normal">Estado</th>
              <th className="px-4 py-3 text-right font-normal">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-white/5 animate-pulse">
                  {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded" /></td>)}
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-white/20">No hay órdenes</td></tr>
            ) : (
              orders.map((order) => (
                <>
                  <tr
                    key={order.id}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer"
                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-white/30">{order.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{new Date(order.createdAt).toLocaleDateString('es-AR')}</td>
                    <td className="px-4 py-3">
                      <p className="text-white/80 text-xs">{order.user.name}</p>
                      <p className="text-white/30 text-xs">{order.user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-accent text-sm">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[order.status] || 'bg-white/10 text-white/40'}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {NEXT_STATUS[order.status] && (
                        <button
                          onClick={() => handleAdvance(order)}
                          disabled={updating === order.id}
                          className="text-xs px-2 py-1 bg-accent/20 text-accent hover:bg-accent/30 rounded transition-colors disabled:opacity-50"
                        >
                          {updating === order.id ? '...' : NEXT_LABEL[order.status]}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === order.id && (
                    <tr key={`${order.id}-detail`} className="border-b border-white/5 bg-white/2">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="space-y-3">
                          <p className="text-xs text-white/40"><span className="text-white/60">Dirección:</span> {order.address}</p>
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-3">
                                <img src={item.product.images?.[0] || ''} alt="" className="w-8 h-8 object-cover rounded bg-white/5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                <div className="flex-1">
                                  <p className="text-xs text-white/70">{item.product.name}</p>
                                  <p className="text-xs text-white/30">x{item.quantity} × {formatPrice(item.price)}</p>
                                </div>
                                <span className="text-xs font-mono text-white/50">{formatPrice(item.price * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                          {/* Status progress */}
                          <div className="flex items-center gap-2 mt-2">
                            {STATUS_FLOW.map((s, i) => {
                              const currentIdx = STATUS_FLOW.indexOf(order.status)
                              const done = i <= currentIdx
                              return (
                                <div key={s} className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${done ? 'bg-accent' : 'bg-white/10'}`} />
                                  <span className={`text-xs ${done ? 'text-white/60' : 'text-white/20'}`}>{STATUS_LABELS[s]}</span>
                                  {i < STATUS_FLOW.length - 1 && <div className={`w-8 h-px ${done && i < currentIdx ? 'bg-accent' : 'bg-white/10'}`} />}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
