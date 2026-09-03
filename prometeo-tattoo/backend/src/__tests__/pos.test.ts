import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

const TEST_JWT_SECRET = 'test-secret'
const PRODUCT_ID = '11111111-1111-1111-1111-111111111111'

beforeAll(() => {
  process.env.JWT_SECRET = TEST_JWT_SECRET
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test'
  process.env.MERCADOPAGO_ACCESS_TOKEN = 'TEST-dummy'
  process.env.ALLOWED_ORIGINS = 'http://localhost:5173'
  process.env.NODE_ENV = 'test'
})

// Mock Prisma so no real DB is needed. $transaction ejecuta el callback
// pasándole el mismo mock (mismo patrón que usaría un cliente real donde
// `tx` tiene la misma forma que `prisma`).
vi.mock('../config/prisma', () => {
  const prismaMock = {
    product: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    sale: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    stockMovement: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => cb(prismaMock)),
  }
  return { prisma: prismaMock }
})

function makeToken(role = 'ADMIN') {
  return jwt.sign({ userId: 'admin-1', role }, TEST_JWT_SECRET, { expiresIn: '1h' })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/admin/pos/sales', () => {
  it('returns 401 without a token', async () => {
    const { default: app } = await import('../app')
    const res = await request(app)
      .post('/api/admin/pos/sales')
      .send({ items: [{ productId: PRODUCT_ID, quantity: 1 }] })
    expect(res.status).toBe(401)
  })

  it('returns 403 for a non-admin token', async () => {
    const token = makeToken('CUSTOMER')
    const { default: app } = await import('../app')
    const res = await request(app)
      .post('/api/admin/pos/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: PRODUCT_ID, quantity: 1 }] })
    expect(res.status).toBe(403)
  })

  it('returns 400 when items is empty', async () => {
    const token = makeToken()
    const { default: app } = await import('../app')
    const res = await request(app)
      .post('/api/admin/pos/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [] })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('errors')
  })

  it('returns 400 when productId is not a valid UUID', async () => {
    const token = makeToken()
    const { default: app } = await import('../app')
    const res = await request(app)
      .post('/api/admin/pos/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: 'not-a-uuid', quantity: 1 }] })
    expect(res.status).toBe(400)
  })

  it('returns 409 when stock is insufficient', async () => {
    const token = makeToken()
    const { prisma } = await import('../config/prisma')
    ;(prisma.product.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: PRODUCT_ID, name: 'Tinta negra', price: 1000, stock: 0 },
    ])
    ;(prisma.sale.count as ReturnType<typeof vi.fn>).mockResolvedValue(0)
    ;(prisma.product.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 })
    ;(prisma.product.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      stock: 0,
      name: 'Tinta negra',
    })

    const { default: app } = await import('../app')
    const res = await request(app)
      .post('/api/admin/pos/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: PRODUCT_ID, quantity: 1 }] })

    expect(res.status).toBe(409)
  })

  it('returns 201 and the created sale when stock is sufficient', async () => {
    const token = makeToken()
    const { prisma } = await import('../config/prisma')
    ;(prisma.product.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: PRODUCT_ID, name: 'Tinta negra', price: 1000, stock: 10 },
    ])
    ;(prisma.sale.count as ReturnType<typeof vi.fn>).mockResolvedValue(4)
    ;(prisma.product.updateMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 1 })
    ;(prisma.sale.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'sale-1',
      code: 'VENTA-00005',
      total: 2000,
      paymentMethod: 'EFECTIVO',
      items: [{ productId: PRODUCT_ID, quantity: 2, price: 1000, name: 'Tinta negra' }],
    })

    const { default: app } = await import('../app')
    const res = await request(app)
      .post('/api/admin/pos/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId: PRODUCT_ID, quantity: 2 }], paymentMethod: 'EFECTIVO' })

    expect(res.status).toBe(201)
    expect(res.body.code).toBe('VENTA-00005')
    expect(prisma.stockMovement.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ productId: PRODUCT_ID, type: 'SALE_POS', delta: -2 }),
      ],
    })
  })
})

describe('GET /api/admin/pos/sales', () => {
  it('returns 401 without a token', async () => {
    const { default: app } = await import('../app')
    const res = await request(app).get('/api/admin/pos/sales')
    expect(res.status).toBe(401)
  })
})
