import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200),
  description: z.string().min(1, 'La descripción es requerida').max(5000),
  price: z.number({ required_error: 'El precio es requerido' }).positive('El precio debe ser positivo'),
  comparePrice: z.number().positive().nullable().optional(),
  stock: z.number({ required_error: 'El stock es requerido' }).int().min(0, 'El stock no puede ser negativo'),
  categoryId: z.string().uuid('categoryId debe ser un UUID válido'),
  brand: z.string().min(1, 'La marca es requerida').max(100),
  images: z.array(z.string().url('Cada imagen debe ser una URL válida')).min(0),
  featured: z.boolean().optional(),
  onSale: z.boolean().optional(),
})

export const updateProductSchema = createProductSchema.partial()

export const createCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100),
  image: z.string().url('La imagen debe ser una URL válida').optional().or(z.literal('')),
})

export const updateCategorySchema = createCategorySchema.partial()

export const orderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Estado inválido' }),
  }),
})

const optionalText = z.string().trim().max(100).nullable().optional()

export const createTattooSchema = z.object({
  imageBase64: z.string().min(1, 'La imagen es requerida'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  title: optionalText,
  artist: optionalText,
  style: optionalText,
})

export const updateTattooSchema = z.object({
  title: optionalText,
  artist: optionalText,
  style: optionalText,
  position: z.number().int().optional(),
})
