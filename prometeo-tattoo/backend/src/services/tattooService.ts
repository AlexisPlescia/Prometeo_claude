import { prisma } from '../config/prisma'

const MAX_IMAGE_BYTES = 3 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Todo menos los bytes de la imagen: la lista viaja liviana y cada foto se
// pide aparte (y queda cacheada) por GET /api/tattoos/:id/image.
const listSelect = { id: true, title: true, artist: true, style: true, position: true, createdAt: true }

function httpError(message: string, statusCode: number) {
  const err: Error & { statusCode?: number } = new Error(message)
  err.statusCode = statusCode
  return err
}

export async function listTattoos() {
  return prisma.tattooWork.findMany({
    select: listSelect,
    orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
  })
}

export async function getTattooImage(id: string) {
  const work = await prisma.tattooWork.findUnique({ where: { id }, select: { image: true, mimeType: true } })
  if (!work) throw httpError('Imagen no encontrada', 404)
  return work
}

export async function createTattoo(data: {
  imageBase64: string
  mimeType: string
  title?: string
  artist?: string
  style?: string
}) {
  if (!ALLOWED_TYPES.includes(data.mimeType)) throw httpError('Formato no soportado (JPG, PNG o WebP)', 400)
  const image = Buffer.from(data.imageBase64, 'base64')
  if (image.length === 0) throw httpError('La imagen está vacía', 400)
  if (image.length > MAX_IMAGE_BYTES) throw httpError('La imagen supera los 3 MB', 400)

  // Las nuevas van al principio de la galería
  const first = await prisma.tattooWork.findFirst({ orderBy: { position: 'asc' }, select: { position: true } })
  return prisma.tattooWork.create({
    data: {
      image,
      mimeType: data.mimeType,
      title: data.title || null,
      artist: data.artist || null,
      style: data.style || null,
      position: (first?.position ?? 1) - 1,
    },
    select: listSelect,
  })
}

export async function updateTattoo(
  id: string,
  data: { title?: string | null; artist?: string | null; style?: string | null; position?: number },
) {
  return prisma.tattooWork.update({ where: { id }, data, select: listSelect })
}

export async function deleteTattoo(id: string) {
  await prisma.tattooWork.delete({ where: { id } })
}
