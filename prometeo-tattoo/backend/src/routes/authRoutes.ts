import { Router } from 'express'
import { register, login, refresh, getMe, changePassword } from '../controllers/authController'
import { auth } from '../middlewares/auth'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', auth, refresh)
router.get('/me', auth, getMe)
router.patch('/password', auth, changePassword)

export default router
