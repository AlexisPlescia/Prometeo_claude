import { Router } from 'express'
import * as tattooController from '../controllers/tattooController'

const router = Router()

router.get('/', tattooController.list)
router.get('/:id/image', tattooController.image)

export default router
