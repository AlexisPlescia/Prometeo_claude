import { Router } from 'express'
import { auth } from '../middlewares/auth'
import { adminOnly } from '../middlewares/adminOnly'
import { validate } from '../middlewares/validate'
import * as adminController from '../controllers/adminController'
import * as posController from '../controllers/posController'
import * as expenseController from '../controllers/expenseController'
import {
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  updateCategorySchema,
  orderStatusSchema,
} from '../schemas/admin'
import { createSaleSchema } from '../schemas/pos'
import { createExpenseSchema } from '../schemas/expense'

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

// Punto de venta (mostrador)
router.get('/pos/sales', posController.getSales)
router.post('/pos/sales', validate(createSaleSchema), posController.createSale)
router.post('/pos/sales/:id/void', posController.voidSale)

// Control de gastos
router.get('/expenses', expenseController.getExpenses)
router.post('/expenses', validate(createExpenseSchema), expenseController.createExpense)
router.delete('/expenses/:id', expenseController.deleteExpense)

export default router
