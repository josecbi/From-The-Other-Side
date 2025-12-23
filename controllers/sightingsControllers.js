import { db } from '../data/db.js'
import { stories } from '../data/stories.js'
import { v4 as uuidv4 } from 'uuid'

export async function getSightings(req, res) {

    const query = 'SELECT * FROM sightings'
    try {
        const sightings = await db.all(query)
        res.status(200).json(sightings)
    } catch (err) {
        console.log("Can't connect to database.", new Error(err))

    }
}

export async function getSighting(req, res) {
    try {
        const { sightingId } = req.params
        if (!sightingId) return res.status(400).json({ error: 'Missing sighting id' })

        const query = `SELECT * FROM sightings WHERE uuid = ?`
        const param = [sightingId]
        const sighting = await db.get(query, param)

        if (!sighting) return res.status(404).json({ error: 'Sighting not found' })

        res.status(200).json(sighting)
    } catch (err) {
        console.error(new Error(err))
        res.status(500).json({ error: 'Internal server error' })
    }
}

export async function addSighting(req, res) {
    const { location, timeStamp, title, text } = req.body
    const query = `INSERT INTO sightings (uuid, location, timeStamp, title, text)
        VALUES (?, ?, ?, ?, ?)
    `
    const params = [uuidv4(), location, timeStamp, title, text]

    try {
        await db.run(query, params)
        res.status(200)
        res.end()
    } catch (err) {
        console.error('Something went wrong adding the sighting to the database.', new Error(err))
    }
}

export function handleNews(req, res) {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'

    })

    res.status(200)

    const intervalId = setInterval(() => {
        const randomNumber = Math.floor(Math.random() * stories.length)
        res.write(`data: ${JSON.stringify({
            event: 'news-update',
            story: stories[randomNumber]
        })}\n\n`)
    }, 4000)

    req.on('close', () => {
        clearInterval(intervalId)
        res.end()
    })
}

export async function deleteSighting(req, res) {
    try {
        const uuid = req.params.sightingId
        const query = `DELETE FROM sightings WHERE uuid = ?`
        await db.run(query, [uuid])
        res.status(200).json({ success: true })
    } catch (err) {
        console.error("Something went wrong trying to delete the sighting.", new Error(err))
        res.status(500).json({ success: false })
    }
}

export async function updateSighting(req, res) {
    try {
        const { sightingId } = req.params
        const { location, timeStamp, title, text } = req.body
        if (!sightingId) return res.status(400).json({ error: 'Missing sighting id' })

        const query = `UPDATE sightings SET location = ?, timeStamp = ?, title = ?, text = ? WHERE uuid = ?`
        const params = [location, timeStamp, title, text, sightingId]
        await db.run(query, params)
        res.status(200).json({ success: true })
    } catch (err) {
        console.error('Error updating sighting', new Error(err))
        res.status(500).json({ success: false })
    }
}

