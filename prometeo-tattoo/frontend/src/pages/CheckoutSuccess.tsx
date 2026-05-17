import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { formatPrice } from '../utils/formatPrice'

interface SuccessState {
  orderId?: string
  total?: number
  paymentAlias?: string
  paymentCbu?: string
}

export default function CheckoutSuccess() {
  const location = useLocation()
  const { refreshCart } = useCart()
  const state = (location.state ?? {}) as SuccessState

  const orderId = state.orderId
  const total = state.total
  const paymentAlias = state.paymentAlias
  const paymentCbu = state.paymentCbu

  useEffect(() => {
    document.title = '¡Pedido confirmado! — Prometeo Tattoo'
    refreshCart()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-900/30 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-3xl tracking-widest text-[#e8e8e8] mb-3">
            PEDIDO CONFIRMADO
          </h1>
          {orderId && (
            <p className="font-mono text-accent text-lg font-bold">
              #{orderId.slice(0, 8).toUpperCase()}
            </p>
          )}
          <p className="font-body text-[#e8e8e8]/50 text-sm mt-2">
            Revisá tu email — te enviamos los detalles del pedido
          </p>
        </div>

        {/* Payment instructions */}
        <div className="card-dark p-6 mb-6">
          <h2 className="font-semibold text-[#e8e8e8] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            Instrucciones de pago
          </h2>

          {total !== undefined && (
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
              <span className="text-[#e8e8e8]/60 text-sm">Total a transferir</span>
              <span className="font-mono text-accent text-xl font-bold">{formatPrice(total)}</span>
            </div>
          )}

          <p className="text-sm text-[#e8e8e8]/70 mb-4">
            Realizá una transferencia bancaria por el monto total a:
          </p>

          <div className="bg-[#070709] border border-white/10 rounded-lg p-4 space-y-3 mb-4">
            {paymentAlias ? (
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#e8e8e8]/40 uppercase tracking-wider">Alias</span>
                <span className="font-mono text-[#e8e8e8] text-base font-semibold tracking-wider">{paymentAlias}</span>
              </div>
            ) : (
              <p className="text-sm text-[#e8e8e8]/40 italic text-center">
                El alias de transferencia se confirmará por email
              </p>
            )}
            {paymentCbu && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#e8e8e8]/40 uppercase tracking-wider">CBU</span>
                <span className="font-mono text-[#e8e8e8]/70 text-sm">{paymentCbu}</span>
              </div>
            )}
          </div>

          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
            <p className="text-sm text-[#e8e8e8]/80 font-medium mb-1">Paso siguiente</p>
            <p className="text-sm text-[#e8e8e8]/60">
              Una vez realizada la transferencia, envianos el <strong className="text-[#e8e8e8]">comprobante</strong> indicando tu número de orden{' '}
              {orderId && <strong className="text-accent font-mono">#{orderId.slice(0, 8).toUpperCase()}</strong>}.
              Podés hacerlo por WhatsApp o al email que figura en el pie de la tienda.
            </p>
          </div>
        </div>

        {/* What's next */}
        <div className="card-dark p-5 mb-8">
          <h3 className="text-sm font-semibold text-[#e8e8e8]/60 uppercase tracking-wider mb-4">¿Qué pasa ahora?</h3>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Transferís el monto total al alias/CBU indicado' },
              { step: '2', text: 'Nos enviás el comprobante con el número de orden' },
              { step: '3', text: 'Confirmamos el pago y preparamos tu pedido (48 h hábiles)' },
              { step: '4', text: 'Te avisamos cuando tu pedido está en camino' },
            ].map(({ step, text }) => (
              <div key={step} className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-accent">{step}</span>
                </div>
                <p className="text-sm text-[#e8e8e8]/60">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Link to="/profile" className="btn-secondary flex-1 text-center">
            Ver mis órdenes
          </Link>
          <Link to="/" className="btn-primary flex-1 text-center">
            Seguir comprando
          </Link>
        </div>

      </div>
    </div>
  )
}
