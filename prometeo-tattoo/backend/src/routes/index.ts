import { Router } from 'express'
import productRoutes from './productRoutes'
import categoryRoutes from './categoryRoutes'
import authRoutes from './authRoutes'
import cartRoutes from './cartRoutes'
import orderRoutes from './orderRoutes'
import adminRoutes from './adminRoutes'
import paymentRoutes from './paymentRoutes'
import configRoutes from './configRoutes'
import tattooRoutes from './tattooRoutes'

const router = Router()

router.use('/products', productRoutes)
router.use('/categories', categoryRoutes)
router.use('/auth', authRoutes)
router.use('/cart', cartRoutes)
router.use('/orders', orderRoutes)
router.use('/admin', adminRoutes)
router.use('/payments', paymentRoutes)
router.use('/config', configRoutes)
router.use('/tattoos', tattooRoutes)

export { router }
