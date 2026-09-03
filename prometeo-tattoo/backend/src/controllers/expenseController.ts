import { Request, Response, NextFunction } from 'express'
import * as expenseService from '../services/expenseService'

export const createExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expense = await expenseService.createExpense(req.user!.userId, req.body)
    res.status(201).json(expense)
  } catch (err) {
    next(err)
  }
}

export const getExpenses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query
    const expenses = await expenseService.getExpenses(
      from ? new Date(from as string) : undefined,
      to ? new Date(to as string) : undefined,
    )
    res.json(expenses)
  } catch (err) {
    next(err)
  }
}

export const deleteExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await expenseService.deleteExpense(req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
