import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/prisma'
import { env } from '../config/env'

export async function register(name: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    const err: Error & { statusCode?: number } = new Error('El email ya está registrado')
    err.statusCode = 409
    throw err
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: '7d',
  })

  return { user, token }
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    const err: Error & { statusCode?: number } = new Error('Credenciales inválidas')
    err.statusCode = 401
    throw err
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    const err: Error & { statusCode?: number } = new Error('Credenciales inválidas')
    err.statusCode = 401
    throw err
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: '7d',
  })

  const { password: _, ...userWithoutPassword } = user
  return { user: userWithoutPassword, token }
}

export async function refreshToken(userId: string, role: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })
  if (!user) {
    const err: Error & { statusCode?: number } = new Error('Usuario no encontrado')
    err.statusCode = 404
    throw err
  }
  const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: '7d' })
  return { user, token }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })
  if (!user) {
    const err: Error & { statusCode?: number } = new Error('Usuario no encontrado')
    err.statusCode = 404
    throw err
  }
  return user
}
