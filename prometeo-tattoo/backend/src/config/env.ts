// ─── Supabase connection string notes ──────────────────────────────────────
// Render (long-running Express) → usar Session Pooler (puerto 5432):
//   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require
//
// Si usás Transaction Pooler (puerto 6543 / PgBouncer), agregar:
//   ?pgbouncer=true&connection_limit=1
// Sin esos params Prisma falla con "prepared statement X already exists" → HTTP 500.
// ────────────────────────────────────────────────────────────────────────────

const isProd = process.env.NODE_ENV === 'production'

function required(key: string): string {
  const val = process.env[key]
  if (!val) {
    const msg = `[env] Variable crítica faltante: ${key}`
    if (isProd) {
      console.error(msg)
      // Crash explícito en producción — es mejor que arrancar con DB rota
      process.exit(1)
    } else {
      console.warn(msg)
    }
  }
  return val ?? ''
}

function optional(key: string, fallback = ''): string {
  return process.env[key] ?? fallback
}

export const env = {
  PORT: optional('PORT', '4000'),
  NODE_ENV: optional('NODE_ENV', 'development'),
  DATABASE_URL: required('DATABASE_URL'),
  JWT_SECRET: required('JWT_SECRET'),
  // MercadoPago — deshabilitado temporalmente (MVP sin MP)
  // MERCADOPAGO_ACCESS_TOKEN: required('MERCADOPAGO_ACCESS_TOKEN'),
  MERCADOPAGO_ACCESS_TOKEN: optional('MERCADOPAGO_ACCESS_TOKEN'),
  MERCADOPAGO_PUBLIC_KEY: optional('MERCADOPAGO_PUBLIC_KEY'),
  MERCADOPAGO_WEBHOOK_SECRET: optional('MERCADOPAGO_WEBHOOK_SECRET'),
  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:5173'),
  BACKEND_URL: optional('BACKEND_URL', 'http://localhost:4000'),
  ALLOWED_ORIGINS: optional('ALLOWED_ORIGINS', 'http://localhost:5173'),
  // Email (nodemailer) — opcional; si no está configurado las órdenes igual se crean
  SMTP_HOST: optional('SMTP_HOST'),
  SMTP_PORT: optional('SMTP_PORT', '587'),
  SMTP_USER: optional('SMTP_USER'),
  SMTP_PASS: optional('SMTP_PASS'),
  SMTP_FROM: optional('SMTP_FROM', 'Prometeo Tattoo <noreply@prometeo.com>'),
  ADMIN_EMAIL: optional('ADMIN_EMAIL'),
  CRON_SECRET: optional('CRON_SECRET'),
}
