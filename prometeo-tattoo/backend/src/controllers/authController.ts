import { Request, Response, NextFunction } from 'express'
import * as authService from '../services/authService'

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      res.status(400).json({ error: true, message: 'name, email y password son requeridos' })
      return
    }
    const result = await authService.register(name, email, password)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400).json({ error: true, message: 'email y password son requeridos' })
      return
    }
    const result = await authService.login(email, password)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.refreshToken(req.user!.userId, req.user!.role)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: true, message: 'currentPassword y newPassword son requeridos' })
      return
    }
    if (typeof newPassword !== 'string' || newPassword.length < 12) {
      res.status(400).json({ error: true, message: 'La nueva contraseña debe tener al menos 12 caracteres' })
      return
    }
    await authService.changePassword(req.user!.userId, currentPassword, newPassword)
    res.json({ message: 'Contraseña actualizada' })
  } catch (err) {
    next(err)
  }
}

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.getMe(req.user!.userId)
    res.json(user)
  } catch (err) {
    next(err)
  }
}
