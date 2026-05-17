import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'

export interface AppError extends Error {
  statusCode?: number
}

function prismaKnownStatusCode(err: Prisma.PrismaClientKnownRequestError): number {
  switch (err.code) {
    case 'P2025': return 404 // record not found
    case 'P2002': return 409 // unique constraint
    case 'P2003': return 400 // foreign key constraint
    case 'P2014': return 400 // relation violation
    default:      return 500
  }
}

function prismaKnownMessage(err: Prisma.PrismaClientKnownRequestError): string {
  switch (err.code) {
    case 'P2025': return 'Registro no encontrado'
    case 'P2002': return 'Ya existe un registro con ese valor'
    case 'P2003': return 'Referencia inválida'
    default:      return 'Error de base de datos'
  }
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Error de conexión / inicialización de Prisma (DB no disponible, DATABASE_URL inválida, etc.)
  if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error('[Prisma Init Error]', err.message)
    res.status(503).json({ error: true, message: 'Base de datos no disponible. Intentá más tarde.' })
    return
  }

  // Error de validación de query Prisma (tipos incorrectos, campos desconocidos)
  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error('[Prisma Validation Error]', err.message)
    res.status(400).json({ error: true, message: 'Consulta inválida' })
    return
  }

  // Errores de negocio de Prisma (FK, unique, not found, etc.)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const statusCode = prismaKnownStatusCode(err)
    const message = prismaKnownMessage(err)
    console.error(`[Prisma ${err.code}] ${statusCode} — ${message}`)
    res.status(statusCode).json({ error: true, message })
    return
  }

  const statusCode = err.statusCode || 500
  const message = err.message || 'Error interno del servidor'

  console.error(`[Error] ${statusCode} — ${message}`, err.stack)

  res.status(statusCode).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}
