import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env } from './config/env'
import { router } from './routes/index'
import { errorHandler } from './middlewares/errorHandler'

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

app.get('/api/keepalive', (req, res) => {
  const secret = env.CRON_SECRET
  if (secret && req.query.token !== secret) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api', router)
app.use(errorHandler)

export default app
