import express from 'express'
import cors from 'cors'
import { apiRouter } from './routes/routes.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import { db } from './data/db.js'

const PORT = 8000

const app = express()

const dirname = import.meta.dirname

const schema = await fs.readFile(path.join(dirname, 'data', 'schema.sql'), 'utf-8')

await db.exec(schema)

app.use(cors())

app.use(express.static('public'))

app.use(express.json())

app.use('/api', apiRouter)

app.listen(PORT, () => {
    console.log(`Server listening on: http://localhost:${PORT}`)
})
