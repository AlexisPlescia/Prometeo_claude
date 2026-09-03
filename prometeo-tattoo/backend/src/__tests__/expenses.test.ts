import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

const TEST_JWT_SECRET = 'test-secret'

beforeAll(() => {
  process.env.JWT_SECRET = TEST_JWT_SECRET
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test'
  process.env.MERCADOPAGO_ACCESS_TOKEN = 'TEST-dummy'
  process.env.ALLOWED_ORIGINS = 'http://localhost:5173'
  process.env.NODE_ENV = 'test'
})

vi.mock('../config/prisma', () => ({
  prisma: {
    expense: {
      create: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

function makeToken(role = 'ADMIN') {
  return jwt.sign({ userId: 'admin-1', role }, TEST_JWT_SECRET, { expiresIn: '1h' })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/admin/expenses', () => {
  it('returns 401 without a token', async () => {
    const { default: app } = await import('../app')
    const res = await request(app)
      .post('/api/admin/expenses')
      .send({ description: 'Alquiler', amount: 50000 })
    expect(res.status).toBe(401)
  })

  it('returns 403 for a non-admin token', async () => {
    const token = makeToken('CUSTOMER')
    const { default: app } = await import('../app')
    const res = await request(app)
      .post('/api/admin/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Alquiler', amount: 50000 })
    expect(res.status).toBe(403)
  })

  it('returns 400 when amount is missing', async () => {
    const token = makeToken()
    const { default: app } = await import('../app')
    const res = await request(app)
      .post('/api/admin/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Alquiler' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('errors')
  })

  it('returns 400 when amount is negative', async () => {
    const token = makeToken()
    const { default: app } = await import('../app')
    const res = await request(app)
      .post('/api/admin/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Alquiler', amount: -100 })
    expect(res.status).toBe(400)
  })

  it('returns 201 with the created expense', async () => {
    const token = makeToken()
    const { prisma } = await import('../config/prisma')
    ;(prisma.expense.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'expense-1',
      description: 'Alquiler',
      amount: 50000,
      category: 'Alquiler',
      createdById: 'admin-1',
    })

    const { default: app } = await import('../app')
    const res = await request(app)
      .post('/api/admin/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Alquiler', amount: 50000, category: 'Alquiler' })

    expect(res.status).toBe(201)
    expect(res.body.description).toBe('Alquiler')
  })
})

describe('GET /api/admin/expenses', () => {
  it('returns 401 without a token', async () => {
    const { default: app } = await import('../app')
    const res = await request(app).get('/api/admin/expenses')
    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/admin/expenses/:id', () => {
  it('returns 401 without a token', async () => {
    const { default: app } = await import('../app')
    const res = await request(app).delete('/api/admin/expenses/expense-1')
    expect(res.status).toBe(401)
  })
})
