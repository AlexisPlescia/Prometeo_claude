import { Request, Response, NextFunction } from 'express'
import * as adminService from '../services/adminService'

export const getStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await adminService.getDashboardStats()
    res.json(stats)
  } catch (err) {
    next(err)
  }
}

// Products
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, page, limit } = req.query
    const result = await adminService.adminGetProducts(
      search as string | undefined,
      page ? parseInt(page as string, 10) : 1,
      limit ? parseInt(limit as string, 10) : 20,
    )
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await adminService.adminGetProductById(req.params.id)
    res.json(product)
  } catch (err) {
    next(err)
  }
}

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await adminService.adminCreateProduct(req.body)
    res.status(201).json(product)
  } catch (err) {
    next(err)
  }
}

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await adminService.adminUpdateProduct(req.params.id, req.body)
    res.json(product)
  } catch (err) {
    next(err)
  }
}

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await adminService.adminDeleteProduct(req.params.id)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

// Categories
export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await adminService.adminGetCategories()
    res.json(categories)
  } catch (err) {
    next(err)
  }
}

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await adminService.adminCreateCategory(req.body)
    res.status(201).json(category)
  } catch (err) {
    next(err)
  }
}

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await adminService.adminUpdateCategory(req.params.id, req.body)
    res.json(category)
  } catch (err) {
    next(err)
  }
}

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await adminService.adminDeleteCategory(req.params.id)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

// Orders
export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query
    const orders = await adminService.adminGetOrders(status as string | undefined)
    res.json(orders)
  } catch (err) {
    next(err)
  }
}

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // status ya validado por Zod (orderStatusSchema) antes de llegar acá
    const status = req.body.status as 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
    const order = await adminService.adminUpdateOrderStatus(req.params.id, status)
    res.json(order)
  } catch (err) {
    next(err)
  }
}
