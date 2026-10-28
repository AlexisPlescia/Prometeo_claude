import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from './config/env'
import { router } from './routes/index'
import { errorHandler } from './middlewares/errorHandler'
import { prisma } from './config/prisma'

const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (Postman, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`CORS: origen no permitido — ${origin}`))
      }
    },
    credentials: true,
  }),
)
// Las fotos de la galería llegan en base64 (~1 MB): ese endpoint necesita un
// límite mayor que el de 100 kB del resto de la API.
app.use('/api/admin/tattoos', express.json({ limit: '5mb' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Demasiados intentos. Esperá 15 minutos.' },
})
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Le pega a la base (no solo al proceso) a propósito: el free tier de
// Supabase pausa el proyecto tras ~7 días sin actividad *de queries*, no
// alcanza con que el server esté despierto. Antes esto solo devolvía "ok"
// sin tocar la DB — no evitaba nada. Ver ESTADO_PROYECTO.md.
app.get('/api/keepalive', async (req, res) => {
  const secret = env.CRON_SECRET
  if (secret && req.query.token !== secret) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', db: 'ok', timestamp: new Date().toISOString() })
  } catch (err) {
    console.error('[keepalive] DB no disponible', err)
    res.status(503).json({ status: 'error', db: 'unavailable', timestamp: new Date().toISOString() })
  }
})

app.use('/api', router)
app.use(errorHandler)

export default app
