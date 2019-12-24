require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const Note = require('./models/note')
const cors = require('cors')

app.use(cors())

app.use(bodyParser.json())

const requestLogger = (request, response, next) => {
    console.log('Method:', request.method)
    console.log('Path:  ', request.path)
    console.log('Body:  ', request.body)
    console.log('---')
    next()
}

app.use(requestLogger)

app.use(express.static('build'))

// hello world output
app.get('/', (request, response) => {
    response.send('<h1>Hello World!</h1>')
})

// get all notes
app.get('/api/notes', (request, response, next) => {
    Note.find({})
        .then(notes => {
            response.json(notes.map(note => note.toJSON()))
        })
        .catch(error => next(error))
})

// get note by id
app.get('/api/notes/:id', (request, response, next) => {
    Note.findById(request.params.id)
        .then(note => {
            note ?
                response.json(note.toJSON())
                :
                response.status(404).end()
        })
        .catch(error => next(error))
})

// update note by id
app.put('/api/notes/:id', (request, response, next) => {
    const body = request.body

    const note = {
        content: body.content,
        important: body.important
    }

    Note.findByIdAndUpdate(request.params.id, note, { new: true })
        .then(updatedNote => {
            response.json(updatedNote.toJSON())
        })
        .catch(error => next(error))
})

// delete note by id
app.delete('/api/notes/:id', (request, response, next) => {
    Note.findByIdAndRemove(request.params.id)
        .then(note => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

// add note
app.post('/api/notes', (request, response, next) => {
    const body = request.body

    if (body.content === undefined) {
        return response.status(400).json({
            error: 'content missing'
        })
    }

    const note = new Note({
        content: body.content,
        important: body.important || false,
        date: new Date()
    })

    note.save()
        .then(savedNote => savedNote.toJSON())
        .then(savedAndFormattedNote => {
            response.json(savedAndFormattedNote)
        })
        .catch(error => next(error))
})

// get info on notes
app.get('/api/info', (req, res) => {
    res.send(`${notes.length} Saved Notes.<br/><br/>${notes.filter(note=>note.important===true).length} notes marked Important.<br/><br/>${new Date()}`)
})

// fires if no other route is taken
const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

// handler for requests with errors
const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    }

    next(error)
}
app.use(errorHandler)

// specify and listen to port
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})