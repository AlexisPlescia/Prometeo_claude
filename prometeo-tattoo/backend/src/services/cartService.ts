import { prisma } from '../config/prisma'

const CART_INCLUDE = {
  items: {
    include: {
      product: {
        include: { category: true },
      },
    },
  },
}

async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: CART_INCLUDE,
  })
}

export async function getCart(userId: string) {
  return getOrCreateCart(userId)
}

export async function addItem(userId: string, productId: string, quantity: number) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } })
    if (!product) {
      const err: Error & { statusCode?: number } = new Error('Producto no encontrado')
      err.statusCode = 404
      throw err
    }

    const cart = await tx.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    })

    const existing = await tx.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    })

    if (existing) {
      const newQty = existing.quantity + quantity
      if (product.stock < newQty) {
        const err: Error & { statusCode?: number } = new Error(
          `Stock insuficiente. Disponible: ${product.stock}`,
        )
        err.statusCode = 409
        throw err
      }
      await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } })
    } else {
      if (product.stock < quantity) {
        const err: Error & { statusCode?: number } = new Error(
          `Stock insuficiente. Disponible: ${product.stock}`,
        )
        err.statusCode = 409
        throw err
      }
      await tx.cartItem.create({ data: { cartId: cart.id, productId, quantity } })
    }

    return tx.cart.findUnique({ where: { id: cart.id }, include: CART_INCLUDE })
  })
}

export async function updateItem(userId: string, itemId: string, quantity: number) {
  const cart = await prisma.cart.findUnique({ where: { userId } })
  if (!cart) {
    const err: Error & { statusCode?: number } = new Error('Carrito no encontrado')
    err.statusCode = 404
    throw err
  }

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    include: { product: true },
  })
  if (!item) {
    const err: Error & { statusCode?: number } = new Error('Item no encontrado')
    err.statusCode = 404
    throw err
  }

  if (item.product.stock < quantity) {
    const err: Error & { statusCode?: number } = new Error(
      `Stock insuficiente. Disponible: ${item.product.stock}`,
    )
    err.statusCode = 409
    throw err
  }

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } })
  } else {
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } })
  }

  return prisma.cart.findUnique({ where: { userId }, include: CART_INCLUDE })
}

export async function removeItem(userId: string, itemId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } })
  if (!cart) {
    const err: Error & { statusCode?: number } = new Error('Carrito no encontrado')
    err.statusCode = 404
    throw err
  }

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
  })
  if (!item) {
    const err: Error & { statusCode?: number } = new Error('Item no encontrado')
    err.statusCode = 404
    throw err
  }

  await prisma.cartItem.delete({ where: { id: itemId } })
  return prisma.cart.findUnique({ where: { userId }, include: CART_INCLUDE })
}

