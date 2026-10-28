import { Router } from 'express'
import { auth } from '../middlewares/auth'
import { adminOnly } from '../middlewares/adminOnly'
import { validate } from '../middlewares/validate'
import * as adminController from '../controllers/adminController'
import * as tattooController from '../controllers/tattooController'
import {
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  updateCategorySchema,
  orderStatusSchema,
  createTattooSchema,
  updateTattooSchema,
} from '../schemas/admin'

const router = Router()

router.use(auth, adminOnly)

router.get('/stats', adminController.getStats)

router.get('/products', adminController.getProducts)
router.post('/products', validate(createProductSchema), adminController.createProduct)
router.get('/products/:id', adminController.getProduct)
router.patch('/products/:id', validate(updateProductSchema), adminController.updateProduct)
router.delete('/products/:id', adminController.deleteProduct)

router.get('/categories', adminController.getCategories)
router.post('/categories', validate(createCategorySchema), adminController.createCategory)
router.patch('/categories/:id', validate(updateCategorySchema), adminController.updateCategory)
router.delete('/categories/:id', adminController.deleteCategory)

router.get('/orders', adminController.getOrders)
router.patch('/orders/:id', validate(orderStatusSchema), adminController.updateOrderStatus)

router.post('/tattoos', validate(createTattooSchema), tattooController.create)
router.patch('/tattoos/:id', validate(updateTattooSchema), tattooController.update)
router.delete('/tattoos/:id', tattooController.remove)

export default router
