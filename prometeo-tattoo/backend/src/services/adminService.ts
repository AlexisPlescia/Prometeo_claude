import { prisma } from '../config/prisma'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ─── STATS ─────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const [
    totalOrders,
    totalProducts,
    totalCustomers,
    revenueAgg,
    ordersByStatusRaw,
    recentOrders,
    orderItems,
    allOrders,
    salesAgg,
    expenseAgg,
    allSales,
    allExpenses,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: ['DELIVERED', 'CONFIRMED', 'SHIPPED'] } },
    }),
    prisma.order.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } }, items: { include: { product: { select: { name: true } } } } },
    }),
    prisma.orderItem.findMany({
      include: { product: { include: { category: true } } },
    }),
    prisma.order.findMany({
      where: { status: { in: ['DELIVERED', 'CONFIRMED', 'SHIPPED'] } },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    // Ventas de mostrador (POS) — se excluyen las anuladas de todos los
    // totales, igual que una orden CANCELLED no suma en revenueAgg.
    prisma.sale.aggregate({ _sum: { total: true }, where: { voided: false } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.sale.findMany({
      where: { voided: false },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.expense.findMany({
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  // Top products
  const productSales: Record<string, { name: string; category: string; totalSold: number; revenue: number }> = {}
  for (const item of orderItems) {
    if (!productSales[item.productId]) {
      productSales[item.productId] = {
        name: item.name || item.product.name,
        category: item.product.category?.name || '',
        totalSold: 0,
        revenue: 0,
      }
    }
    productSales[item.productId].totalSold += item.quantity
    productSales[item.productId].revenue += item.price * item.quantity
  }
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 10)

  // Sales by category
  const categorySales: Record<string, { revenue: number; count: number }> = {}
  for (const item of orderItems) {
    const cat = item.product.category?.name || 'Sin categoría'
    if (!categorySales[cat]) categorySales[cat] = { revenue: 0, count: 0 }
    categorySales[cat].revenue += item.price * item.quantity
    categorySales[cat].count += item.quantity
  }
  const totalCatRevenue = Object.values(categorySales).reduce((s, c) => s + c.revenue, 0)
  const salesByCategory = Object.entries(categorySales).map(([category, data]) => ({
    category,
    revenue: data.revenue,
    count: data.count,
    percentage: totalCatRevenue > 0 ? Math.round((data.revenue / totalCatRevenue) * 100) : 0,
  }))

  // Monthly sales - últimos 12 meses (online + mostrador, menos gastos)
  const months: Record<string, { revenue: number; orders: number; posRevenue: number; expenses: number }> = {}
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months[key] = { revenue: 0, orders: 0, posRevenue: 0, expenses: 0 }
  }
  for (const order of allOrders) {
    const d = new Date(order.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (months[key]) {
      months[key].revenue += order.total
      months[key].orders += 1
    }
  }
  for (const sale of allSales) {
    const d = new Date(sale.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (months[key]) months[key].posRevenue += sale.total
  }
  for (const expense of allExpenses) {
    const d = new Date(expense.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (months[key]) months[key].expenses += expense.amount
  }
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const monthlySales = Object.entries(months).map(([key, data]) => {
    const [year, month] = key.split('-')
    return {
      month: `${monthNames[parseInt(month) - 1]} ${year}`,
      revenue: data.revenue,
      orders: data.orders,
      posRevenue: data.posRevenue,
      expenses: data.expenses,
      netProfit: data.revenue + data.posRevenue - data.expenses,
    }
  })

  // Daily sales - últimos 30 días (online + mostrador, menos gastos)
  const dailySales: Record<string, { revenue: number; orders: number; posRevenue: number; expenses: number }> = {}
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentOrdersAll = await prisma.order.findMany({
    where: { createdAt: { gte: thirtyDaysAgo }, status: { in: ['DELIVERED', 'CONFIRMED', 'SHIPPED'] } },
    select: { total: true, createdAt: true },
  })
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    dailySales[key] = { revenue: 0, orders: 0, posRevenue: 0, expenses: 0 }
  }
  for (const order of recentOrdersAll) {
    const key = new Date(order.createdAt).toISOString().split('T')[0]
    if (dailySales[key]) {
      dailySales[key].revenue += order.total
      dailySales[key].orders += 1
    }
  }
  for (const sale of allSales) {
    const key = new Date(sale.createdAt).toISOString().split('T')[0]
    if (dailySales[key]) dailySales[key].posRevenue += sale.total
  }
  for (const expense of allExpenses) {
    const key = new Date(expense.createdAt).toISOString().split('T')[0]
    if (dailySales[key]) dailySales[key].expenses += expense.amount
  }
  const dailySalesArr = Object.entries(dailySales).map(([date, data]) => ({
    date,
    ...data,
    netProfit: data.revenue + data.posRevenue - data.expenses,
  }))

  // Low stock
  const lowStockProducts = await prisma.product.findMany({
    where: { stock: { lt: 5 } },
    select: { name: true, stock: true },
    orderBy: { stock: 'asc' },
  })

  // Metrics
  const totalRevenue = revenueAgg._sum.total ?? 0
  const totalSalesPOS = salesAgg._sum.total ?? 0
  const totalExpenses = expenseAgg._sum.amount ?? 0
  const netProfit = totalRevenue + totalSalesPOS - totalExpenses
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const ordersByStatus = ordersByStatusRaw.map((o) => ({ status: o.status, count: o._count.id }))

  // Revenue growth vs previous month
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const [thisMonthRev, lastMonthRev] = await Promise.all([
    prisma.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: thisMonthStart }, status: { in: ['DELIVERED', 'CONFIRMED', 'SHIPPED'] } },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart }, status: { in: ['DELIVERED', 'CONFIRMED', 'SHIPPED'] } },
    }),
  ])
  const tmr = thisMonthRev._sum.total ?? 0
  const lmr = lastMonthRev._sum.total ?? 0
  const revenueGrowth = lmr > 0 ? Math.round(((tmr - lmr) / lmr) * 100) : 0

  return {
    totalRevenue,
    totalSalesPOS,
    totalExpenses,
    netProfit,
    totalOrders,
    totalProducts,
    totalCustomers,
    averageOrderValue,
    revenueGrowth,
    ordersByStatus,
    topProducts,
    salesByCategory,
    monthlySales,
    dailySales: dailySalesArr,
    lowStockProducts,
    recentOrders,
  }
}

// ─── PRODUCTS ──────────────────────────────────────────────────────────────

export async function adminGetProducts(search?: string, page = 1, limit = 20) {
  const where = search
    ? { name: { contains: search, mode: 'insensitive' as const } }
    : {}
  const skip = (page - 1) * limit
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])
  return { products, total, page, totalPages: Math.ceil(total / limit) }
}

export async function adminGetProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  })
  if (!product) {
    const err: Error & { statusCode?: number } = new Error('Producto no encontrado')
    err.statusCode = 404
    throw err
  }
  return product
}

export async function adminCreateProduct(data: {
  name: string
  description: string
  price: number
  comparePrice?: number
  stock: number
  categoryId: string
  brand: string
  images: string[]
  featured?: boolean
  onSale?: boolean
}) {
  const slug = slugify(data.name)
  const existing = await prisma.product.findUnique({ where: { slug } })
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug

  return prisma.product.create({
    data: {
      ...data,
      slug: finalSlug,
      featured: data.featured ?? false,
      onSale: data.onSale ?? false,
    },
    include: { category: true },
  })
}

export async function adminUpdateProduct(
  id: string,
  data: Partial<{
    name: string
    description: string
    price: number
    comparePrice: number | null
    stock: number
    categoryId: string
    brand: string
    images: string[]
    featured: boolean
    onSale: boolean
  }>,
) {
  const updateData: Record<string, unknown> = { ...data }
  if (data.name) {
    updateData.slug = slugify(data.name)
  }
  return prisma.product.update({
    where: { id },
    data: updateData,
    include: { category: true },
  })
}

export async function adminDeleteProduct(id: string) {
  const orderCount = await prisma.orderItem.count({ where: { productId: id } })
  if (orderCount > 0) {
    const err: Error & { statusCode?: number } = new Error(
      `No se puede eliminar: el producto tiene ${orderCount} orden(es) asociada(s)`,
    )
    err.statusCode = 409
    throw err
  }
  return prisma.product.delete({ where: { id } })
}

// ─── CATEGORIES ────────────────────────────────────────────────────────────

export async function adminGetCategories() {
  return prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  })
}

export async function adminCreateCategory(data: { name: string; image?: string }) {
  const slug = slugify(data.name)
  return prisma.category.create({ data: { name: data.name, slug, image: data.image } })
}

export async function adminUpdateCategory(id: string, data: { name?: string; image?: string }) {
  const updateData: Record<string, unknown> = { ...data }
  if (data.name) updateData.slug = slugify(data.name)
  return prisma.category.update({ where: { id }, data: updateData })
}

export async function adminDeleteCategory(id: string) {
  const count = await prisma.product.count({ where: { categoryId: id } })
  if (count > 0) {
    const err: Error & { statusCode?: number } = new Error(
      `No se puede eliminar: tiene ${count} producto(s) asociado(s)`,
    )
    err.statusCode = 409
    throw err
  }
  return prisma.category.delete({ where: { id } })
}

// ─── ORDERS ────────────────────────────────────────────────────────────────

export async function adminGetOrders(status?: string) {
  type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  const validStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']
  const filteredStatus = status && validStatuses.includes(status as OrderStatus) ? (status as OrderStatus) : undefined
  return prisma.order.findMany({
    where: filteredStatus ? { status: filteredStatus } : {},
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { product: { select: { name: true, images: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

const STATUS_FLOW = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED']

export async function adminUpdateOrderStatus(id: string, status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED') {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  })
  if (!order) {
    const err: Error & { statusCode?: number } = new Error('Orden no encontrada')
    err.statusCode = 404
    throw err
  }

  if (status === 'CANCELLED') {
    if (order.status === 'CANCELLED') return order
    // Restaurar stock en transacción atómica
    return prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
      return tx.order.update({ where: { id }, data: { status: 'CANCELLED' } })
    })
  }

  const currentIdx = STATUS_FLOW.indexOf(order.status)
  const newIdx = STATUS_FLOW.indexOf(status)
  if (newIdx < currentIdx) {
    const err: Error & { statusCode?: number } = new Error('No se puede retroceder el estado de una orden')
    err.statusCode = 400
    throw err
  }
  return prisma.order.update({ where: { id }, data: { status } })
}
