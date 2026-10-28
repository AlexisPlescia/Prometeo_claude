import { prisma } from './prisma'

// Crea las tablas nuevas si faltan. No sabemos con qué comando arranca Render
// (el `prisma db push` del Dockerfile no corrió en el deploy del 27/10/2026),
// así que el server se asegura solo. Idempotente y solo aditivo: nunca
// modifica ni borra tablas existentes. El SQL es el que genera
// `prisma migrate diff` para el modelo TattooWork.
const statements = [
  `CREATE TABLE IF NOT EXISTS "TattooWork" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "artist" TEXT,
    "style" TEXT,
    "image" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TattooWork_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "TattooWork_position_idx" ON "TattooWork"("position")`,
]

export async function ensureSchema() {
  try {
    for (const sql of statements) await prisma.$executeRawUnsafe(sql)
    console.log('[schema] TattooWork OK')
  } catch (err) {
    // El resto de la tienda no depende de esto: arrancar igual
    console.error('[schema] No se pudo asegurar TattooWork', err)
  }
}
