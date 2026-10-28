import { Request, Response, NextFunction } from 'express'
import * as tattooService from '../services/tattooService'

export const list = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await tattooService.listTattoos())
  } catch (err) {
    next(err)
  }
}

export const image = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const work = await tattooService.getTattooImage(req.params.id)
    // El frontend vive en otro dominio (Vercel): helmet por defecto bloquea
    // que otro origen cargue el recurso.
    res.set('Cross-Origin-Resource-Policy', 'cross-origin')
    // Una imagen nunca cambia bajo el mismo id (editar = borrar y subir otra)
    res.set('Cache-Control', 'public, max-age=31536000, immutable')
    res.type(work.mimeType).send(Buffer.from(work.image))
  } catch (err) {
    next(err)
  }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await tattooService.createTattoo(req.body))
  } catch (err) {
    next(err)
  }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await tattooService.updateTattoo(req.params.id, req.body))
  } catch (err) {
    next(err)
  }
}

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await tattooService.deleteTattoo(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}
