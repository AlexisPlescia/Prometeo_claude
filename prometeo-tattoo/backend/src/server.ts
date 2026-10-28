import app from './app'
import { env } from './config/env'
import { ensureSchema } from './config/ensureSchema'

const PORT = parseInt(env.PORT, 10)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] Prometeo Tattoo API corriendo en http://0.0.0.0:${PORT}`)
  void ensureSchema()
})
