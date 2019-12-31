const jwt = require('jsonwebtoken')
const notesRouter = require('express').Router()
const Note = require('../models/note')
const User = require('../models/user')

const getTokenFrom = request => {
    const authorization = request.get('authorization')
    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        return authorization.substring(7)
    }
    return null
}

// get all notes
notesRouter.get('/', async (request, response) => {
    const notes = await Note
        .find({})
        .populate('user', { username: 1, name: 1 })

    response.json(notes.map(note => note.toJSON()))
})

// get note by id
notesRouter.get('/:id', async (request, response, next) => {
    try {
        const note = await Note.findById(request.params.id)
        if (note) {
            response.json(note.toJSON())
        } else {
            response.status(404).end()
        }
    } catch (exception) {
        next(exception)
    }
})

// add new note
notesRouter.post('/', async (request, response, next) => {
    const body = request.body

    const token = getTokenFrom(request)

    try {
        const decodedToken = jwt.verify(token, process.env.SECRET)
        if (!token || !decodedToken.id) {
            return response.status(401).json({ error: 'token missing or invalid' })
        }
        console.log(body)
        const user = await User.findById(decodedToken.id)

        const note = new Note({
            content: body.content,
            important: body.important || false,
            date: new Date(),
            user: user._id
        })

        const savedNote = await note.save()
        user.notes = user.notes.concat(savedNote._id)
        await user.save()
        response.status(201).json(savedNote.toJSON())
    } catch(exception) {
        next(exception)
    }
})

// delete note by id
notesRouter.delete('/:id', async (request, response, next) => {
    try {
        await Note.findByIdAndRemove(request.params.id)
        response.status(204).end()
    } catch (exception) {
        next(exception)
    }
})

// update note by id
notesRouter.put('/:id', async (request, response, next) => {
    const body = request.body

    const note = {
        content: body.content,
        important: body.important,
    }

    try {
        Note.findByIdAndUpdate(request.params.id, note, { new: true })
        response.status(201).end()
    } catch(exception) {
        next(exception)
    }
})

module.exports = notesRouter