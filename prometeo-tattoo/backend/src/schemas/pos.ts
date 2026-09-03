import { z } from 'zod'

export const createSaleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid('productId debe ser un UUID válido'),
        quantity: z
          .number({ required_error: 'La cantidad es requerida' })
          .int()
          .positive('La cantidad debe ser mayor a 0'),
      }),
    )
    .min(1, 'La venta debe tener al menos un producto'),
  paymentMethod: z
    .enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'], {
      errorMap: () => ({ message: 'Método de pago inválido' }),
    })
    .default('EFECTIVO'),
  notes: z.string().max(500).optional(),
})
