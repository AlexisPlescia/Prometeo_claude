import nodemailer from 'nodemailer'
import { env } from '../config/env'

function getTransport() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT, 10),
    secure: parseInt(env.SMTP_PORT, 10) === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  })
}

interface OrderEmailData {
  orderId: string
  customerName: string
  customerEmail: string
  items: { name: string; quantity: number; price: number }[]
  subtotal: number
  shippingCost: number
  total: number
  address: string
  phone?: string
  notes?: string
  paymentAlias: string
  paymentCbu?: string
  contactWhatsapp?: string
  contactEmail?: string
}

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function orderHtml(d: OrderEmailData): string {
  const orderShort = d.orderId.slice(0, 8).toUpperCase()
  const itemsRows = d.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#cccccc">${i.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#999;text-align:center">×${i.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#cccccc;text-align:right;font-family:monospace">${formatARS(i.price * i.quantity)}</td>
        </tr>`,
    )
    .join('')

  const whatsappLink = d.contactWhatsapp
    ? `<a href="https://wa.me/${d.contactWhatsapp.replace(/\D/g, '')}" style="color:#c62828">WhatsApp</a>`
    : ''
  const contactLine = [whatsappLink, d.contactEmail ? `<a href="mailto:${d.contactEmail}" style="color:#c62828">${d.contactEmail}</a>` : '']
    .filter(Boolean)
    .join(' o ')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#111114;border:1px solid #222;border-radius:8px;overflow:hidden">

        <!-- Header -->
        <tr>
          <td style="background:#0d0d10;padding:24px 32px;border-bottom:1px solid #222;text-align:center">
            <p style="margin:0;font-size:20px;letter-spacing:6px;color:#e8e8e8;font-weight:700">PROMETEO TATTOO</p>
            <p style="margin:6px 0 0;font-size:12px;color:#666;letter-spacing:2px">SUMINISTROS PROFESIONALES</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 8px;font-size:22px;color:#e8e8e8;font-weight:600">¡Gracias por tu compra, ${d.customerName}!</p>
            <p style="margin:0 0 24px;color:#888;font-size:14px">Orden <span style="font-family:monospace;color:#c62828">#${orderShort}</span></p>

            <!-- Items -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #222;border-radius:6px;overflow:hidden;margin-bottom:24px">
              <thead>
                <tr style="background:#0d0d10">
                  <th style="padding:8px 12px;text-align:left;font-size:11px;color:#666;font-weight:500;text-transform:uppercase;letter-spacing:1px">Producto</th>
                  <th style="padding:8px 12px;text-align:center;font-size:11px;color:#666;font-weight:500;text-transform:uppercase;letter-spacing:1px">Cant.</th>
                  <th style="padding:8px 12px;text-align:right;font-size:11px;color:#666;font-weight:500;text-transform:uppercase;letter-spacing:1px">Subtotal</th>
                </tr>
              </thead>
              <tbody>${itemsRows}</tbody>
            </table>

            <!-- Totals -->
            <table width="100%" style="margin-bottom:32px">
              ${d.shippingCost === 0
                ? `<tr><td style="color:#888;font-size:14px;padding:4px 0">Envío</td><td style="text-align:right;color:#4ade80;font-size:14px;font-family:monospace">Gratis</td></tr>`
                : `<tr><td style="color:#888;font-size:14px;padding:4px 0">Envío</td><td style="text-align:right;color:#cccccc;font-size:14px;font-family:monospace">${formatARS(d.shippingCost)}</td></tr>`}
              <tr>
                <td style="color:#e8e8e8;font-size:16px;font-weight:600;padding:8px 0 0;border-top:1px solid #333">Total a pagar</td>
                <td style="text-align:right;color:#c62828;font-size:18px;font-weight:700;font-family:monospace;padding:8px 0 0;border-top:1px solid #333">${formatARS(d.total)}</td>
              </tr>
            </table>

            <!-- Payment instructions -->
            <div style="background:#0d0d10;border:1px solid #333;border-radius:8px;padding:20px;margin-bottom:24px">
              <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#e8e8e8;text-transform:uppercase;letter-spacing:1px">Instrucciones de pago</p>
              <p style="margin:0 0 16px;font-size:14px;color:#aaa">Realizá una transferencia bancaria por <strong style="color:#e8e8e8">${formatARS(d.total)}</strong> a:</p>
              <table width="100%">
                <tr>
                  <td style="color:#888;font-size:13px;padding:4px 0">Alias</td>
                  <td style="text-align:right;color:#e8e8e8;font-size:15px;font-family:monospace;font-weight:600;letter-spacing:1px">${d.paymentAlias || 'A CONFIRMAR'}</td>
                </tr>
                ${d.paymentCbu ? `<tr><td style="color:#888;font-size:13px;padding:4px 0">CBU</td><td style="text-align:right;color:#e8e8e8;font-size:13px;font-family:monospace">${d.paymentCbu}</td></tr>` : ''}
              </table>
              <p style="margin:16px 0 0;font-size:13px;color:#888">Una vez realizado el pago, envianos el <strong style="color:#e8e8e8">comprobante de transferencia</strong>${contactLine ? ` por ${contactLine}` : ''} indicando tu número de orden <strong style="color:#c62828">#${orderShort}</strong>.</p>
            </div>

            <!-- Delivery info -->
            <div style="margin-bottom:24px">
              <p style="margin:0 0 8px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px">Envío a</p>
              <p style="margin:0;font-size:14px;color:#cccccc">${d.address}</p>
              ${d.phone ? `<p style="margin:4px 0 0;font-size:13px;color:#888">${d.phone}</p>` : ''}
              ${d.notes ? `<p style="margin:4px 0 0;font-size:13px;color:#666;font-style:italic">${d.notes}</p>` : ''}
            </div>

            <p style="margin:0;font-size:13px;color:#555">Tu pedido será preparado y enviado dentro de las 48 h hábiles una vez confirmado el pago. Ante cualquier consulta escribinos.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0d0d10;padding:16px 32px;border-top:1px solid #222;text-align:center">
            <p style="margin:0;font-size:11px;color:#444">© 2026 Prometeo Tattoo · Suministros profesionales</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function adminNotificationHtml(d: OrderEmailData): string {
  const orderShort = d.orderId.slice(0, 8).toUpperCase()
  const itemsList = d.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')
  return `<div style="font-family:sans-serif;color:#333;max-width:480px">
  <h2 style="color:#c62828">Nueva orden #${orderShort}</h2>
  <p><strong>Cliente:</strong> ${d.customerName} (${d.customerEmail})</p>
  <p><strong>Productos:</strong> ${itemsList}</p>
  <p><strong>Total:</strong> ${formatARS(d.total)}</p>
  <p><strong>Dirección:</strong> ${d.address}</p>
  ${d.phone ? `<p><strong>Teléfono:</strong> ${d.phone}</p>` : ''}
  <p style="color:#888;font-size:13px">Entrá al panel admin para gestionar la orden.</p>
</div>`
}

export async function sendOrderConfirmation(data: OrderEmailData): Promise<void> {
  const transport = getTransport()
  if (!transport) {
    console.warn('[email] SMTP no configurado — email de confirmación no enviado (orden: ' + data.orderId + ')')
    return
  }
  try {
    await transport.sendMail({
      from: env.SMTP_FROM,
      to: data.customerEmail,
      subject: `Pedido confirmado #${data.orderId.slice(0, 8).toUpperCase()} — Prometeo Tattoo`,
      html: orderHtml(data),
    })
    console.log(`[email] Confirmación enviada a ${data.customerEmail} (orden: ${data.orderId})`)
  } catch (err) {
    console.error('[email] Error enviando confirmación:', err)
  }
}

export async function sendNewOrderNotification(data: OrderEmailData): Promise<void> {
  const transport = getTransport()
  if (!transport || !env.ADMIN_EMAIL) return
  try {
    await transport.sendMail({
      from: env.SMTP_FROM,
      to: env.ADMIN_EMAIL,
      subject: `Nueva orden #${data.orderId.slice(0, 8).toUpperCase()} — ${data.customerName} — ${formatARS(data.total)}`,
      html: adminNotificationHtml(data),
    })
  } catch (err) {
    console.error('[email] Error enviando notificación admin:', err)
  }
}
