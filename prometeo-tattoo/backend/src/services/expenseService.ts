import { prisma } from '../config/prisma'

export async function createExpense(
  createdById: string,
  data: { description: string; amount: number; category?: string },
) {
  return prisma.expense.create({
    data: { ...data, createdById },
    include: { createdBy: { select: { name: true } } },
  })
}

export async function getExpenses(from?: Date, to?: Date) {
  return prisma.expense.findMany({
    where:
      from || to
        ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {},
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function deleteExpense(id: string) {
  return prisma.expense.delete({ where: { id } })
}
