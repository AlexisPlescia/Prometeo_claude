import { prisma } from '../config/prisma'
import { sendOrderConfirmation, sendNewOrderNotification } from './emailService'

async function getShippingConfig(): Promise<{ threshold: number; cost: number }> {
  const configs = await prisma.storeConfig.findMany({
    where: { key: { in: ['free_shipping_threshold', 'shipping_cost'] } },
  })
  const map = Object.fromEntries(configs.map((c) => [c.key, parseFloat(c.value)]))
  return {
    threshold: map['free_shipping_threshold'] ?? 15000,
    cost: map['shipping_cost'] ?? 3500,
  }
}

export function calcShipping(subtotal: number, threshold: number, cost: number): number {
  return subtotal >= threshold ? 0 : cost
}

export async function createOrder(
  userId: string,
  address: string,
  phone?: string,
  notes?: string,
) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  })

  if (!cart || cart.items.length === 0) {
    const err: Error & { statusCode?: number } = new Error('El carrito está vacío')
    err.statusCode = 400
    throw err
  }

  const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const { threshold, cost } = await getShippingConfig()
  const shippingCost = calcShipping(subtotal, threshold, cost)
  const total = subtotal + shippingCost

  const order = await prisma.$transaction(async (tx) => {
    // Descuento atómico: solo actualiza si hay stock suficiente
    for (const item of cart.items) {
      const result = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      })
      if (result.count === 0) {
        const current = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        })
        const err: Error & { statusCode?: number } = new Error(
          `Stock insuficiente para "${item.product.name}". Disponible: ${current?.stock ?? 0}`,
        )
        err.statusCode = 409
        throw err
      }
    }

    const newOrder = await tx.order.create({
      data: {
        userId,
        total,
        address,
        phone,
        notes,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
            name: item.product.name,
          })),
        },
      },
      include: {
        items: { include: { product: { include: { category: true } } } },
      },
    })

    // Limpiar carrito dentro de la misma transacción
    await tx.cartItem.deleteMany({ where: { cart: { userId } } })

    return newOrder
  })

  // Leer configuración de pago para incluir en el email
  const paymentConfigs = await prisma.storeConfig.findMany({
    where: { key: { in: ['payment_alias', 'payment_cbu', 'whatsapp_number', 'store_email'] } },
  })
  const cfg = Object.fromEntries(paymentConfigs.map((c) => [c.key, c.value]))

  const emailData = {
    orderId: order.id,
    customerName: order.items[0]
      ? (await prisma.user.findUnique({ where: { id: userId }, select: { name: true } }))?.name ?? 'Cliente'
      : 'Cliente',
    customerEmail: (await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email ?? '',
    items: order.items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price })),
    subtotal: order.items.reduce((s, i) => s + i.price * i.quantity, 0),
    shippingCost: order.total - order.items.reduce((s, i) => s + i.price * i.quantity, 0),
    total: order.total,
    address: order.address,
    phone: order.phone ?? undefined,
    notes: order.notes ?? undefined,
    paymentAlias: cfg['payment_alias'] ?? '',
    paymentCbu: cfg['payment_cbu'],
    contactWhatsapp: cfg['whatsapp_number'],
    contactEmail: cfg['store_email'],
  }

  // No-blocking: los emails no deben romper el flujo del pedido
  void sendOrderConfirmation(emailData)
  void sendNewOrderNotification(emailData)

  return order
}

export async function getOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: { include: { product: true } },
    },
  })
}

export async function getOrderById(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: { include: { product: { include: { category: true } } } },
    },
  })

  if (!order) {
    const err: Error & { statusCode?: number } = new Error('Orden no encontrada')
    err.statusCode = 404
    throw err
  }

  return order
}
