import { describe, it, expect, vi, beforeAll } from 'vitest'
import request from 'supertest'

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret'
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/test'
  process.env.MERCADOPAGO_ACCESS_TOKEN = 'TEST-dummy'
  process.env.ALLOWED_ORIGINS = 'http://localhost:5173'
  process.env.NODE_ENV = 'test'
})

vi.mock('../config/prisma', () => ({
  prisma: {
    tattooWork: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

const adminToken = async () => {
  const jwt = (await import('jsonwebtoken')).default
  return jwt.sign({ userId: 'admin-1', role: 'ADMIN' }, 'test-secret')
}

describe('GET /api/tattoos', () => {
  it('lists the gallery without image bytes', async () => {
    const { prisma } = await import('../config/prisma')
    ;(prisma.tattooWork.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 't1', title: 'Rosa' }])
    const { default: app } = await import('../app')
    const res = await request(app).get('/api/tattoos')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([{ id: 't1', title: 'Rosa' }])
    const args = (prisma.tattooWork.findMany as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(args.select.image).toBeUndefined()
  })
})

describe('GET /api/tattoos/:id/image', () => {
  it('serves the image cross-origin with long cache', async () => {
    const { prisma } = await import('../config/prisma')
    ;(prisma.tattooWork.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      image: Buffer.from([0xff, 0xd8, 0xff]),
      mimeType: 'image/jpeg',
    })
    const { default: app } = await import('../app')
    const res = await request(app).get('/api/tattoos/t1/image')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('image/jpeg')
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin')
    expect(res.headers['cache-control']).toContain('immutable')
  })

  it('returns 404 when it does not exist', async () => {
    const { prisma } = await import('../config/prisma')
    ;(prisma.tattooWork.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const { default: app } = await import('../app')
    const res = await request(app).get('/api/tattoos/nope/image')
    expect(res.status).toBe(404)
  })
})

describe('POST /api/admin/tattoos', () => {
  it('requires an admin token', async () => {
    const { default: app } = await import('../app')
    const res = await request(app).post('/api/admin/tattoos').send({})
    expect(res.status).toBe(401)
  })

  it('rejects unsupported formats', async () => {
    const { default: app } = await import('../app')
    const res = await request(app)
      .post('/api/admin/tattoos')
      .set('Authorization', `Bearer ${await adminToken()}`)
      .send({ imageBase64: 'AAAA', mimeType: 'image/gif' })
    expect(res.status).toBe(400)
  })

  it('accepts a ~1 MB photo (above the default 100 kB body limit)', async () => {
    const { prisma } = await import('../config/prisma')
    ;(prisma.tattooWork.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ position: 0 })
    ;(prisma.tattooWork.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 't2' })
    const { default: app } = await import('../app')
    const big = Buffer.alloc(1024 * 1024, 1).toString('base64')
    const res = await request(app)
      .post('/api/admin/tattoos')
      .set('Authorization', `Bearer ${await adminToken()}`)
      .send({ imageBase64: big, mimeType: 'image/jpeg', title: 'Rosa', style: 'Blackwork' })
    expect(res.status).toBe(201)
    const { data } = (prisma.tattooWork.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(data.image.length).toBe(1024 * 1024)
    expect(data.position).toBe(-1) // la nueva queda primera
  })
})
