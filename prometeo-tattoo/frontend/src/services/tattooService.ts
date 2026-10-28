import api from './api'

export interface TattooWork {
  id: string
  title: string | null
  artist: string | null
  style: string | null
  position: number
  createdAt: string
}

export type TattooFields = Pick<TattooWork, 'title' | 'artist' | 'style'>

const MAX_SIDE = 1600
const JPEG_QUALITY = 0.82

export const tattooImageUrl = (id: string) => `${api.defaults.baseURL}/tattoos/${id}/image`

// Achica la foto en el navegador antes de subirla: una foto de celular pesa
// 3–8 MB y la galería no necesita más de 1600px. Queda en ~200–400 kB.
async function compress(file: File): Promise<{ imageBase64: string; mimeType: string }> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error(`No se pudo leer "${file.name}". Probá con JPG o PNG.`)
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo comprimir la imagen'))), 'image/jpeg', JPEG_QUALITY),
  )
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(blob)
  })
  return { imageBase64: dataUrl.split(',')[1], mimeType: 'image/jpeg' }
}

export const tattooService = {
  async list(): Promise<TattooWork[]> {
    const { data } = await api.get('/tattoos')
    return data
  },

  async upload(file: File, fields: Partial<TattooFields>): Promise<TattooWork> {
    const image = await compress(file)
    const { data } = await api.post('/admin/tattoos', { ...image, ...fields })
    return data
  },

  async update(id: string, data: Partial<TattooFields & { position: number }>): Promise<TattooWork> {
    const { data: res } = await api.patch(`/admin/tattoos/${id}`, data)
    return res
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/admin/tattoos/${id}`)
  },
}
