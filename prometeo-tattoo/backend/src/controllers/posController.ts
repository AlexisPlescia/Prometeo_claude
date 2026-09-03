import { Request, Response, NextFunction } from 'express'
import * as posService from '../services/posService'

export const createSale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items, paymentMethod, notes } = req.body
    const sale = await posService.createSale(req.user!.userId, items, paymentMethod, notes)
    res.status(201).json(sale)
  } catch (err) {
    next(err)
  }
}

export const getSales = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query
    const sales = await posService.getSales(
      from ? new Date(from as string) : undefined,
      to ? new Date(to as string) : undefined,
    )
    res.json(sales)
  } catch (err) {
    next(err)
  }
}

export const voidSale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sale = await posService.voidSale(req.params.id, req.user!.userId)
    res.json(sale)
  } catch (err) {
    next(err)
  }
}
