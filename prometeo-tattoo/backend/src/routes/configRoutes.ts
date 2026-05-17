import { Router } from 'express'
import { getConfig, updateConfig } from '../controllers/configController'
import { auth } from '../middlewares/auth'
import { adminOnly } from '../middlewares/adminOnly'

const router = Router()

// GET sin auth — intencional: el frontend público lo usa para leer
// free_shipping_threshold y shipping_cost en el Checkout (configStore.ts).
// Los valores almacenados son solo de configuración de tienda (umbrales, textos),
// no datos sensibles. El PATCH sí requiere auth + adminOnly.
router.get('/', getConfig)
router.patch('/', auth, adminOnly, updateConfig)

export default router
