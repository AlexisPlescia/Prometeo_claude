import { describe, it, expect, vi, beforeAll } from 'vitest'
import request from 'supertest'

// Set env vars before any app import
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret'
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test'
  process.env.MERCADOPAGO_ACCESS_TOKEN = 'TEST-dummy'
  process.env.ALLOWED_ORIGINS = 'http://localhost:5173'
  process.env.NODE_ENV = 'test'
})

// Mock Prisma so no real DB is needed
vi.mock('../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

describe('POST /api/auth/register', () => {
  it('returns 400 when body is missing required fields', async () => {
    const { default: app } = await import('../app')
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com' }) // missing name and password
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(true)
  })

  it('returns 201 when body is valid and email is not taken', async () => {
    const { prisma } = await import('../config/prisma')
    // email not taken → findUnique returns null
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    // user created successfully
    ;(prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'new@test.com',
      role: 'USER',
      createdAt: new Date(),
    })

    const { default: app } = await import('../app')
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'new@test.com', password: 'password123' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
  })

  it('returns 409 when email is already registered', async () => {
    const { prisma } = await import('../config/prisma')
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'user-1',
      email: 'existing@test.com',
    })

    const { default: app } = await import('../app')
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'existing@test.com', password: 'password123' })

    expect(res.status).toBe(409)
  })
})

describe('POST /api/auth/login', () => {
  it('returns 400 when body is missing required fields', async () => {
    const { default: app } = await import('../app')
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com' }) // missing password
    expect(res.status).toBe(400)
    expect(res.body.error).toBe(true)
  })

  it('returns 401 with invalid credentials (user not found)', async () => {
    const { prisma } = await import('../config/prisma')
    ;(prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const { default: app } = await import('../app')
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@test.com', password: 'wrongpassword' })

    expect(res.status).toBe(401)
  })
})
