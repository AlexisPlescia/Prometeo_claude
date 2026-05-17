import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useAuthStore } from '../store/authStore'
import { useConfigStore } from '../store/configStore'
import { createOrder } from '../services/orderService'
import { formatPrice } from '../utils/formatPrice'

type Step = 'shipping' | 'review'

interface ShippingData {
  address: string
  phone: string
  notes: string
}

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%231a1a1a'/%3E%3C/svg%3E"

function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'shipping', label: 'Envío' },
    { key: 'review', label: 'Revisar' },
  ]
  const idx = steps.findIndex((s) => s.key === current)
  return (
    <div className="flex items-center gap-0 mb-10">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${i <= idx ? 'bg-accent border-accent text-white' : 'border-border text-muted bg-transparent'}`}>
              {i < idx ? '✓' : i + 1}
            </div>
            <span className={`text-xs ${i <= idx ? 'text-[#e8e8e8]' : 'text-muted'}`}>{step.label}</span>
          </div>
          {i < steps.length - 1 && <div className={`h-0.5 flex-1 mx-2 mb-4 transition-colors ${i < idx ? 'bg-accent' : 'bg-border'}`} />}
        </div>
      ))}
    </div>
  )
}

export default function Checkout() {
  const [step, setStep] = useState<Step>('shipping')
  const [shipping, setShipping] = useState<ShippingData>({ address: '', phone: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const submittingRef = useRef(false)
  const { cart, total, itemCount } = useCart()
  const { isAuthenticated } = useAuthStore()
  const { config } = useConfigStore()
  const navigate = useNavigate()

  const shippingThreshold = parseInt(config.free_shipping_threshold || '15000')
  const shippingCost = parseInt(config.shipping_cost || '3500')
  const freeShipping = total >= shippingThreshold
  const finalTotal = total + (freeShipping ? 0 : shippingCost)

  useEffect(() => { document.title = 'Checkout — Prometeo Tattoo' }, [])
  useEffect(() => { if (!isAuthenticated) navigate('/login') }, [isAuthenticated, navigate])
  useEffect(() => {
    if (isAuthenticated && cart && cart.items.length === 0) navigate('/cart')
  }, [cart, isAuthenticated, navigate])

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!shipping.address.trim()) { setError('La dirección es requerida'); return }
    setError('')
    setStep('review')
  }

  const handleConfirm = async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setLoading(true)
    setError('')
    try {
      const order = await createOrder({
        address: shipping.address,
        phone: shipping.phone || undefined,
        notes: shipping.notes || undefined,
      })
      // Pasamos el ID y total al success via state para mostrarlos sin params en URL
      navigate('/checkout/success', {
        state: {
          orderId: order.id,
          total: order.total,
          paymentAlias: config.payment_alias || '',
          paymentCbu: config.payment_cbu || '',
        },
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear la orden'
      setError(msg)
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="section-title mb-8">Checkout</h1>
        <StepIndicator current={step} />

        {step === 'shipping' && (
          <div className="card-dark p-8">
            <h2 className="font-body font-semibold text-lg text-[#e8e8e8] mb-6">Datos de envío</h2>
            <form onSubmit={handleShippingSubmit} className="space-y-4">
              {error && <div className="bg-red-900/20 border border-red-800/40 rounded px-4 py-2 text-sm text-red-400">{error}</div>}
              <div>
                <label className="block text-sm text-[#e8e8e8]/60 mb-2">Dirección completa *</label>
                <input type="text" className="input-field" placeholder="Av. Corrientes 1234, CABA"
                  value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm text-[#e8e8e8]/60 mb-2">Teléfono (opcional)</label>
                <input type="tel" className="input-field" placeholder="+54 11 1234-5678"
                  value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-[#e8e8e8]/60 mb-2">Notas (opcional)</label>
                <textarea className="input-field resize-none h-24" placeholder="Instrucciones de entrega"
                  value={shipping.notes} onChange={(e) => setShipping({ ...shipping, notes: e.target.value })} />
              </div>
              <button type="submit" className="btn-primary w-full mt-2">Continuar →</button>
            </form>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            <div className="card-dark p-6">
              <h2 className="font-body font-semibold text-[#e8e8e8] mb-4">
                Tu pedido ({itemCount} {itemCount === 1 ? 'producto' : 'productos'})
              </h2>
              <div className="space-y-3">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <img src={item.product.images?.[0] || PLACEHOLDER} alt={item.product.name}
                      className="w-12 h-12 object-cover rounded bg-surface flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#e8e8e8] truncate">{item.product.name}</p>
                      <p className="text-xs text-muted">x{item.quantity}</p>
                    </div>
                    <span className="text-sm font-mono text-[#e8e8e8]">{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#e8e8e8]/60">Subtotal</span>
                  <span className="font-mono text-[#e8e8e8]">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#e8e8e8]/60">Envío</span>
                  {freeShipping ? (
                    <span className="font-mono text-green-400">Gratis</span>
                  ) : (
                    <span className="font-mono text-[#e8e8e8]">{formatPrice(shippingCost)}</span>
                  )}
                </div>
                {!freeShipping && (
                  <p className="text-xs text-[#e8e8e8]/30">Envío gratis en compras mayores a {formatPrice(shippingThreshold)}</p>
                )}
                <div className="flex justify-between font-semibold pt-2 border-t border-border">
                  <span className="text-[#e8e8e8]">Total</span>
                  <span className="text-accent font-mono">{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>

            <div className="card-dark p-6">
              <h2 className="font-body font-semibold text-[#e8e8e8] mb-3">Envío a</h2>
              <p className="text-sm text-[#e8e8e8]/70">{shipping.address}</p>
              {shipping.phone && <p className="text-sm text-[#e8e8e8]/50 mt-1">{shipping.phone}</p>}
              {shipping.notes && <p className="text-sm text-[#e8e8e8]/40 mt-1 italic">{shipping.notes}</p>}
            </div>

            {error && <div className="bg-red-900/20 border border-red-800/40 rounded px-4 py-2 text-sm text-red-400">{error}</div>}

            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setStep('shipping')} disabled={loading}>← Volver</button>
              <button className="btn-primary flex-1" onClick={handleConfirm} disabled={loading}>
                {loading ? 'Procesando...' : 'Confirmar pedido →'}
              </button>
            </div>

            <p className="text-center text-xs text-[#e8e8e8]/30">
              Vas a recibir las instrucciones de pago por email
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
