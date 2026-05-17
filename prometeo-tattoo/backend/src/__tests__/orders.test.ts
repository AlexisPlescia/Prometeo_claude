import { describe, it, expect, vi, beforeAll } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

const TEST_JWT_SECRET = 'test-secret'

// Set env vars before any app import
beforeAll(() => {
  process.env.JWT_SECRET = TEST_JWT_SECRET
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test'
  process.env.MERCADOPAGO_ACCESS_TOKEN = 'TEST-dummy'
  process.env.ALLOWED_ORIGINS = 'http://localhost:5173'
  process.env.NODE_ENV = 'test'
})

// Mock Prisma so no real DB is needed
vi.mock('../config/prisma', () => ({
  prisma: {
    order: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    cart: {
      findUnique: vi.fn(),
    },
    cartItem: {
      deleteMany: vi.fn(),
    },
    storeConfig: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}))

// Evitar que emailService intente conectar SMTP en tests
vi.mock('../services/emailService', () => ({
  sendOrderConfirmation: vi.fn().mockResolvedValue(undefined),
  sendNewOrderNotification: vi.fn().mockResolvedValue(undefined),
}))

function makeToken(userId = 'user-1', role = 'CUSTOMER') {
  return jwt.sign({ userId, role }, TEST_JWT_SECRET, { expiresIn: '1h' })
}

describe('POST /api/orders', () => {
  it('returns 401 when no JWT is provided', async () => {
    const { default: app } = await import('../app')
    const res = await request(app).post('/api/orders').send({ address: '123 Main St' })
    expect(res.status).toBe(401)
  })

  it('returns 400 with errors field when address is missing', async () => {
    const token = makeToken()
    const { default: app } = await import('../app')
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({}) // no address

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('errors')
  })

  it('returns 400 with errors field when address is empty string', async () => {
    const token = makeToken()
    const { default: app } = await import('../app')
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ address: '' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('errors')
  })

  it.todo('two simultaneous createOrder calls with same cart are idempotent (concurrency test)')
})
