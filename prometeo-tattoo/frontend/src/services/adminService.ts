import api from './api'

export interface AdminStats {
  totalRevenue: number
  totalSalesPOS: number
  totalExpenses: number
  netProfit: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  averageOrderValue: number
  revenueGrowth: number
  ordersByStatus: { status: string; count: number }[]
  topProducts: { name: string; category: string; totalSold: number; revenue: number }[]
  salesByCategory: { category: string; revenue: number; percentage: number; count: number }[]
  monthlySales: { month: string; revenue: number; orders: number; posRevenue: number; expenses: number; netProfit: number }[]
  dailySales: { date: string; revenue: number; orders: number; posRevenue: number; expenses: number; netProfit: number }[]
  lowStockProducts: { name: string; stock: number }[]
  recentOrders: AdminOrder[]
}

export interface AdminOrder {
  id: string
  createdAt: string
  total: number
  status: string
  address: string
  user: { name: string; email: string }
  items: { id: string; quantity: number; price: number; name: string; product: { name: string; images: string[] } }[]
}

export interface AdminProduct {
  id: string
  name: string
  slug: string
  description: string
  price: number
  comparePrice: number | null
  onSale: boolean
  stock: number
  images: string[]
  brand: string
  featured: boolean
  categoryId: string
  category: { id: string; name: string; slug: string }
  createdAt: string
}

export interface AdminCategory {
  id: string
  name: string
  slug: string
  image?: string
  _count: { products: number }
}

export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA'

export interface Sale {
  id: string
  code: string
  total: number
  paymentMethod: PaymentMethod
  notes: string | null
  voided: boolean
  createdAt: string
  user: { name: string }
  items: { id: string; productId: string; quantity: number; price: number; name: string }[]
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: string | null
  createdAt: string
  createdBy: { name: string }
}

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const { data } = await api.get('/admin/stats')
    return data
  },

  async getProducts(search?: string, page = 1, limit = 20): Promise<{ products: AdminProduct[]; total: number; page: number; totalPages: number }> {
    const { data } = await api.get('/admin/products', { params: { ...(search ? { search } : {}), page, limit } })
    // Defensa: el backend puede devolver el objeto paginado o un array legacy
    if (Array.isArray(data)) {
      return { products: data, total: data.length, page: 1, totalPages: 1 }
    }
    return data
  },

  async getProduct(id: string): Promise<AdminProduct> {
    const { data } = await api.get(`/admin/products/${id}`)
    return data
  },

  async createProduct(data: Partial<AdminProduct>): Promise<AdminProduct> {
    const { data: res } = await api.post('/admin/products', data)
    return res
  },

  async updateProduct(id: string, data: Partial<AdminProduct>): Promise<AdminProduct> {
    const { data: res } = await api.patch(`/admin/products/${id}`, data)
    return res
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/admin/products/${id}`)
  },

  async getCategories(): Promise<AdminCategory[]> {
    const { data } = await api.get('/admin/categories')
    return data
  },

  async createCategory(data: { name: string; image?: string }): Promise<AdminCategory> {
    const { data: res } = await api.post('/admin/categories', data)
    return res
  },

  async updateCategory(id: string, data: { name?: string; image?: string }): Promise<AdminCategory> {
    const { data: res } = await api.patch(`/admin/categories/${id}`, data)
    return res
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/admin/categories/${id}`)
  },

  async getOrders(status?: string): Promise<AdminOrder[]> {
    const { data } = await api.get('/admin/orders', { params: status ? { status } : {} })
    return data
  },

  async updateOrderStatus(id: string, status: string): Promise<AdminOrder> {
    const { data } = await api.patch(`/admin/orders/${id}`, { status })
    return data
  },

  async getConfig(): Promise<Record<string, string>> {
    const { data } = await api.get('/config')
    return data
  },

  async updateConfig(updates: Record<string, string>): Promise<void> {
    await api.patch('/config', updates)
  },

  // Punto de venta (mostrador)
  async getSales(from?: string, to?: string): Promise<Sale[]> {
    const { data } = await api.get('/admin/pos/sales', { params: { ...(from ? { from } : {}), ...(to ? { to } : {}) } })
    return data
  },

  async createSale(data: {
    items: { productId: string; quantity: number }[]
    paymentMethod: PaymentMethod
    notes?: string
  }): Promise<Sale> {
    const { data: res } = await api.post('/admin/pos/sales', data)
    return res
  },

  async voidSale(id: string): Promise<Sale> {
    const { data } = await api.post(`/admin/pos/sales/${id}/void`)
    return data
  },

  // Control de gastos
  async getExpenses(from?: string, to?: string): Promise<Expense[]> {
    const { data } = await api.get('/admin/expenses', { params: { ...(from ? { from } : {}), ...(to ? { to } : {}) } })
    return data
  },

  async createExpense(data: { description: string; amount: number; category?: string }): Promise<Expense> {
    const { data: res } = await api.post('/admin/expenses', data)
    return res
  },

  async deleteExpense(id: string): Promise<void> {
    await api.delete(`/admin/expenses/${id}`)
  },
}
