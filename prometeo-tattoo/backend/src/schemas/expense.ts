import { z } from 'zod'

export const createExpenseSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida').max(300),
  amount: z.number({ required_error: 'El monto es requerido' }).positive('El monto debe ser positivo'),
  category: z.string().max(100).optional(),
})
