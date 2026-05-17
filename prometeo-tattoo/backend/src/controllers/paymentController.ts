// ─── MercadoPago — deshabilitado (MVP sin MP) ────────────────────────────────
// El flujo de pago actual es: cliente crea orden → recibe email con alias/CBU
// → envía comprobante de transferencia → admin confirma manualmente en panel.
//
// Para reactivar MP: descomentar todo este archivo, restaurar paymentRoutes.ts
// y la línea de paymentRoutes en routes/index.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express'

// Placeholder para que TypeScript no se queje con el import en paymentRoutes
export const createPreference = (_req: Request, res: Response, _next: NextFunction) => {
  res.status(503).json({ error: true, message: 'Pasarela de pago no disponible temporalmente' })
}

export const webhook = (_req: Request, res: Response, _next: NextFunction) => {
  res.status(200).json({ received: true })
}

/*
──────────────────────────────────────────────────────────────
CÓDIGO ORIGINAL DE MP (descomentar cuando se reactive):
──────────────────────────────────────────────────────────────

import crypto from 'crypto'
import { prisma } from '../config/prisma'
import { env } from '../config/env'
import * as paymentService from '../services/paymentService'

export const createPreference = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.body
    if (!orderId) {
      res.status(400).json({ error: true, message: 'orderId requerido' })
      return
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: req.user!.userId },
      include: {
        items: true,
        user: { select: { email: true } },
      },
    })

    if (!order) {
      res.status(404).json({ error: true, message: 'Orden no encontrada' })
      return
    }

    const result = await paymentService.createPreference({
      id: order.id,
      total: order.total,
      items: order.items.map((item) => ({
        name: item.name || `Producto ${item.productId}`,
        quantity: item.quantity,
        price: item.price,
      })),
      userEmail: order.user.email,
    })

    res.json(result)
  } catch (err) {
    next(err)
  }
}

function validateMPSignature(req: Request): boolean {
  const secret = env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[MP Webhook] MERCADOPAGO_WEBHOOK_SECRET no configurado — aceptando en dev')
      return true
    }
    console.error('[MP Webhook] MERCADOPAGO_WEBHOOK_SECRET no configurado en producción — rechazando')
    return false
  }

  const xSignature = req.headers['x-signature'] as string | undefined
  const xRequestId = req.headers['x-request-id'] as string | undefined

  if (!xSignature) return false

  const parts = Object.fromEntries(
    xSignature.split(',').map((p) => p.split('=') as [string, string]),
  )
  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  const dataId = (req.query['data.id'] || req.body?.data?.id || '') as string
  const manifest = `id:${dataId};request-id:${xRequestId ?? ''};ts:${ts};`
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1))
}

async function fetchMPPayment(paymentId: string) {
  const resp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}` },
  })
  if (!resp.ok) throw new Error(`MP API error: ${resp.status}`)
  return resp.json() as Promise<{
    status: string
    external_reference: string
    id: number
  }>
}

export const webhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({ received: true })

    if (!validateMPSignature(req)) {
      console.warn('[MP Webhook] Firma inválida — descartado')
      return
    }

    const { type, data } = req.body
    if (type !== 'payment' || !data?.id) return

    const paymentId = String(data.id)

    let payment: { status: string; external_reference: string; id: number }
    try {
      payment = await fetchMPPayment(paymentId)
    } catch (e) {
      console.error('[MP Webhook] Error consultando API de MP:', e)
      return
    }

    if (payment.status !== 'approved') return

    const orderId = payment.external_reference
    if (!orderId) return

    const updated = await prisma.order.updateMany({
      where: { id: orderId, status: 'PENDING' },
      data: { status: 'CONFIRMED', mpPaymentId: paymentId },
    })

    if (updated.count > 0) {
      console.log(`[MP Webhook] Orden ${orderId} confirmada (pago ${paymentId})`)
    }
  } catch (err) {
    next(err)
  }
}
──────────────────────────────────────────────────────────────
*/
