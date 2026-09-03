import { prisma } from '../config/prisma'

type SaleItemInput = { productId: string; quantity: number }
type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'

function generateSaleCode(sequence: number): string {
  return `VENTA-${String(sequence).padStart(5, '0')}`
}

export async function createSale(
  userId: string,
  items: SaleItemInput[],
  paymentMethod: PaymentMethod,
  notes?: string,
) {
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
  })
  const productMap = new Map(products.map((p) => [p.id, p]))

  for (const item of items) {
    if (!productMap.has(item.productId)) {
      const err: Error & { statusCode?: number } = new Error(
        `Producto no encontrado: ${item.productId}`,
      )
      err.statusCode = 404
      throw err
    }
  }

  const total = items.reduce((sum, item) => {
    const product = productMap.get(item.productId)!
    return sum + product.price * item.quantity
  }, 0)

  // Código de recibo secuencial. No es atómico frente a dos ventas
  // simultáneas (dos cajas cobrando al mismo instante podrían pisarse el
  // número) — para un solo mostrador no es un problema real, y si colisiona
  // el @@unique de `code` lo frena con un 409 en vez de guardar un
  // duplicado. Si en algún momento hay más de una caja en simultáneo,
  // conviene pasar esto a una secuencia de Postgres.
  const count = await prisma.sale.count()
  const code = generateSaleCode(count + 1)

  return prisma.$transaction(async (tx) => {
    // Descuento atómico: mismo patrón que orderService.createOrder — solo
    // actualiza si hay stock suficiente, así dos ventas simultáneas nunca
    // dejan stock negativo.
    for (const item of items) {
      const result = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      })
      if (result.count === 0) {
        const current = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, name: true },
        })
        const err: Error & { statusCode?: number } = new Error(
          `Stock insuficiente para "${current?.name ?? item.productId}". Disponible: ${current?.stock ?? 0}`,
        )
        err.statusCode = 409
        throw err
      }
    }

    const sale = await tx.sale.create({
      data: {
        code,
        userId,
        total,
        paymentMethod,
        notes,
        items: {
          create: items.map((item) => {
            const product = productMap.get(item.productId)!
            return {
              productId: item.productId,
              quantity: item.quantity,
              price: product.price,
              name: product.name,
            }
          }),
        },
      },
      include: { items: true },
    })

    await tx.stockMovement.createMany({
      data: items.map((item) => ({
        productId: item.productId,
        type: 'SALE_POS' as const,
        delta: -item.quantity,
        saleId: sale.id,
        userId,
      })),
    })

    return sale
  })
}

export async function getSales(from?: Date, to?: Date) {
  return prisma.sale.findMany({
    where:
      from || to
        ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {},
    include: { items: true, user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function voidSale(id: string, userId: string) {
  const sale = await prisma.sale.findUnique({ where: { id }, include: { items: true } })
  if (!sale) {
    const err: Error & { statusCode?: number } = new Error('Venta no encontrada')
    err.statusCode = 404
    throw err
  }
  if (sale.voided) {
    const err: Error & { statusCode?: number } = new Error('La venta ya estaba anulada')
    err.statusCode = 409
    throw err
  }

  return prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      })
    }

    await tx.stockMovement.createMany({
      data: sale.items.map((item) => ({
        productId: item.productId,
        type: 'ADJUSTMENT' as const,
        delta: item.quantity,
        saleId: sale.id,
        userId,
      })),
    })

    return tx.sale.update({ where: { id }, data: { voided: true } })
  })
}
