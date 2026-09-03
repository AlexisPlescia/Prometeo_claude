import { useEffect, useState } from 'react'
import { adminService, AdminProduct, PaymentMethod, Sale } from '../../services/adminService'
import { formatPrice } from '../../utils/formatPrice'

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect width='60' height='60' fill='%231a1a1a'/%3E%3C/svg%3E"

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
}

type TicketItem = { productId: string; name: string; price: number; stock: number; quantity: number }

export default function AdminPOS() {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [ticket, setTicket] = useState<TicketItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO')
  const [notes, setNotes] = useState('')
  const [charging, setCharging] = useState(false)
  const [chargeError, setChargeError] = useState('')
  const [lastSale, setLastSale] = useState<Sale | null>(null)

  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [loadingSales, setLoadingSales] = useState(true)
  const [voiding, setVoiding] = useState<string | null>(null)

  const loadProducts = (s?: string) => {
    setLoadingProducts(true)
    adminService.getProducts(s, 1, 40)
      .then(({ products: prods }) => setProducts(prods))
      .catch(console.error)
      .finally(() => setLoadingProducts(false))
  }

  const loadSales = () => {
    setLoadingSales(true)
    adminService.getSales()
      .then((sales) => setRecentSales(sales.slice(0, 10)))
      .catch(console.error)
      .finally(() => setLoadingSales(false))
  }

  useEffect(() => {
    document.title = 'Punto de venta — Admin'
    loadProducts()
    loadSales()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadProducts(search || undefined)
  }

  const addToTicket = (product: AdminProduct) => {
    setTicket((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return prev
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      if (product.stock <= 0) return prev
      return [...prev, { productId: product.id, name: product.name, price: product.price, stock: product.stock, quantity: 1 }]
    })
  }

  const changeQuantity = (productId: string, delta: number) => {
    setTicket((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: Math.min(i.stock, Math.max(0, i.quantity + delta)) } : i))
        .filter((i) => i.quantity > 0),
    )
  }

  const removeItem = (productId: string) => {
    setTicket((prev) => prev.filter((i) => i.productId !== productId))
  }

  const total = ticket.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const handleCharge = async () => {
    if (ticket.length === 0) return
    setCharging(true)
    setChargeError('')
    setLastSale(null)
    try {
      const sale = await adminService.createSale({
        items: ticket.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod,
        notes: notes.trim() || undefined,
      })
      setLastSale(sale)
      setTicket([])
      setNotes('')
      loadProducts(search || undefined) // refresca stock mostrado
      loadSales()
    } catch (err) {
      setChargeError(err instanceof Error ? err.message : 'No se pudo registrar la venta')
    } finally {
      setCharging(false)
    }
  }

  const handleVoid = async (sale: Sale) => {
    if (!confirm(`¿Anular la venta ${sale.code}? Se restaura el stock.`)) return
    setVoiding(sale.id)
    try {
      await adminService.voidSale(sale.id)
      loadSales()
      loadProducts(search || undefined)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo anular la venta')
    } finally {
      setVoiding(null)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl tracking-widest text-white">PUNTO DE VENTA</h1>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Buscador + grilla de productos */}
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              className="input-admin flex-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto por nombre..."
            />
            <button type="submit" className="px-4 py-2 bg-white/10 text-white text-sm rounded hover:bg-white/15 transition-colors">
              Buscar
            </button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {loadingProducts ? (
              [...Array(8)].map((_, i) => <div key={i} className="h-32 bg-white/5 rounded-lg animate-pulse" />)
            ) : products.length === 0 ? (
              <p className="col-span-full text-center text-white/20 py-12">Sin productos</p>
            ) : (
              products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToTicket(product)}
                  disabled={product.stock <= 0}
                  className="bg-[#0d0d10] border border-white/5 rounded-lg p-3 text-left hover:border-accent/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <img
                    src={product.images?.[0] || PLACEHOLDER}
                    alt=""
                    className="w-full h-16 object-cover rounded bg-white/5 mb-2"
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }}
                  />
                  <p className="text-xs text-white/80 truncate">{product.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-xs text-accent">{formatPrice(product.price)}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${product.stock === 0 ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/40'}`}>
                      {product.stock === 0 ? 'sin stock' : `${product.stock} ud.`}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Ticket */}
        <div className="bg-[#0d0d10] border border-white/5 rounded-lg p-5 h-fit xl:sticky xl:top-6 space-y-4">
          <h2 className="text-sm font-semibold text-white/70">Ticket</h2>

          {chargeError && (
            <div className="bg-red-900/20 border border-red-800/30 rounded px-3 py-2 text-xs text-red-400">{chargeError}</div>
          )}
          {lastSale && (
            <div className="bg-green-900/20 border border-green-800/30 rounded px-3 py-2 text-xs text-green-400">
              Venta {lastSale.code} registrada — {formatPrice(lastSale.total)}
            </div>
          )}

          {ticket.length === 0 ? (
            <p className="text-white/20 text-sm py-6 text-center">Tocá un producto para agregarlo</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {ticket.map((item) => (
                <div key={item.productId} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/80 truncate">{item.name}</p>
                    <p className="text-xs text-white/30">{formatPrice(item.price)} c/u</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => changeQuantity(item.productId, -1)} className="w-6 h-6 rounded bg-white/5 text-white/50 hover:bg-white/10 transition-colors">−</button>
                    <span className="w-6 text-center text-xs font-mono text-white/70">{item.quantity}</span>
                    <button onClick={() => changeQuantity(item.productId, 1)} disabled={item.quantity >= item.stock} className="w-6 h-6 rounded bg-white/5 text-white/50 hover:bg-white/10 transition-colors disabled:opacity-30">+</button>
                  </div>
                  <span className="font-mono text-xs text-accent w-16 text-right shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  <button onClick={() => removeItem(item.productId)} className="text-white/20 hover:text-red-400 transition-colors shrink-0" aria-label="Quitar">✕</button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-white/5 pt-3 flex items-center justify-between">
            <span className="text-sm text-white/50">Total</span>
            <span className="font-mono text-xl text-accent">{formatPrice(total)}</span>
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1.5">Método de pago</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`px-2 py-1.5 rounded text-xs transition-colors ${paymentMethod === method ? 'bg-accent text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                >
                  {PAYMENT_LABELS[method]}
                </button>
              ))}
            </div>
          </div>

          <input
            className="input-admin"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Nota (opcional)"
          />

          <button
            onClick={handleCharge}
            disabled={ticket.length === 0 || charging}
            className="w-full py-2.5 bg-accent text-white text-sm font-semibold rounded hover:bg-red-700 transition-colors disabled:opacity-40"
          >
            {charging ? 'Cobrando...' : `Cobrar ${ticket.length > 0 ? formatPrice(total) : ''}`}
          </button>
        </div>
      </div>

      {/* Ventas recientes */}
      <div className="bg-[#0d0d10] border border-white/5 rounded-lg overflow-hidden">
        <h2 className="text-sm font-semibold text-white/70 p-5 pb-0">Ventas recientes</h2>
        <table className="w-full text-sm mt-4">
          <thead className="border-b border-white/5">
            <tr className="text-white/30 text-xs">
              <th className="px-4 py-3 text-left font-normal">#</th>
              <th className="px-4 py-3 text-left font-normal">Fecha</th>
              <th className="px-4 py-3 text-left font-normal">Cajero</th>
              <th className="px-4 py-3 text-left font-normal">Pago</th>
              <th className="px-4 py-3 text-right font-normal">Total</th>
              <th className="px-4 py-3 text-right font-normal">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loadingSales ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="border-b border-white/5 animate-pulse">
                  {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded" /></td>)}
                </tr>
              ))
            ) : recentSales.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-white/20">Todavía no hay ventas de mostrador</td></tr>
            ) : (
              recentSales.map((sale) => (
                <tr key={sale.id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${sale.voided ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs text-white/50">{sale.code}</td>
                  <td className="px-4 py-3 text-white/50 text-xs">{new Date(sale.createdAt).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-white/50 text-xs">{sale.user.name}</td>
                  <td className="px-4 py-3 text-white/50 text-xs">{PAYMENT_LABELS[sale.paymentMethod]}</td>
                  <td className="px-4 py-3 text-right font-mono text-accent text-sm">{formatPrice(sale.total)}</td>
                  <td className="px-4 py-3 text-right">
                    {sale.voided ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">Anulada</span>
                    ) : (
                      <button
                        onClick={() => handleVoid(sale)}
                        disabled={voiding === sale.id}
                        className="text-xs px-2 py-1 bg-white/5 text-white/40 hover:bg-red-900/20 hover:text-red-400 rounded transition-colors disabled:opacity-50"
                      >
                        {voiding === sale.id ? '...' : 'Anular'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
      `}</style>
    </div>
  )
}
