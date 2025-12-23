import express from 'express'
import { getSightings, handleNews, addSighting, deleteSighting, getSighting, updateSighting } from '../controllers/sightingsControllers.js'

export const apiRouter = express.Router()


apiRouter.get('/news', handleNews)
apiRouter.get('/', getSightings)
apiRouter.get('/:sightingId', getSighting)
apiRouter.post('/', addSighting)
apiRouter.put('/:sightingId', updateSighting)
apiRouter.delete('/:sightingId', deleteSighting)
