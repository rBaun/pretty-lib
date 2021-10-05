const express = require('express');
const router = express.Router();
const Author = require('../models/author')
const Book = require('../models/book')

// GET: Search Authors
router.get('/', async (req, res) => {
    let searchOptions = setSearchOptions(req);

    try {
        const authors = await Author.find(searchOptions)
        res.render('authors/index', {
            authors: authors,
            searchOptions: req.query
        })
    } catch {
        res.redirect('/')
    }
})

// GET: New Author Form Page
router.get('/new', (req, res) => {
    res.render('authors/new', { author: new Author() })
})

// POST: Create Author
router.post('/', async (req, res) => {
    const author = new Author({
        name: req.body.name
    })
    let errorMessage = generateAuthorErrorMessage(author, req, 'create')

    try {
        if (errorMessage != null) { throw new Error(errorMessage) }

        const createdAuthor = await author.save()
        res.redirect(`authors/${createdAuthor.id}`)
    } catch {
        res.render('authors/new', {
            author: author,
            errorMessage: errorMessage
        })
    }
})

// GET: Show Author
router.get('/:id', async (req, res) => {
    try {
        const author = await Author.findById(req.params.id)
        const authorBooks = await Book.find({ author: author.id }).limit(6).exec()

        res.render('authors/show', {
            author: author,
            booksByAuthor: authorBooks
        })
    } catch {
        res.redirect('/')
    }
})

// GET: Edit Author
router.get('/:id/edit', async (req, res) => {
    try {
        const author = await Author.findById(req.params.id)

        res.render('authors/edit', { author: author })
    } catch {
        res.redirect('authors')
    }
})

// PUT: Update Author
router.put('/:id', async (req, res) => {
    let author
    let errorMessage

    updateAuthor: try {
        author = await Author.findById(req.params.id)
        author.name = req.body.name
        errorMessage = generateAuthorErrorMessage(author, req, 'update')
        if (errorMessage != null) { throw new Error(errorMessage) }

        await author.save()
        res.redirect(`/authors/${author.id}`)
    } catch {
        if (author == null) { res.redirect('/'); break updateAuthor }

        res.render('authors/edit', {
            author: author,
            errorMessage: errorMessage
        })
    }
})

// DELETE: Delete Author
router.delete('/:id', async (req, res) => {
    let author
    removeAuthor: try {
        author = await Author.findById(req.params.id)
        await author.remove()
        res.redirect(`/authors`)
    } catch {
        if (author == null) { res.redirect('/'); break removeAuthor }

        res.redirect(`/authors/${author.id}`)
    }
})

function setSearchOptions(request) {
    if (request.query.name != null && request.query.name !== '') {
        return { name: new RegExp(request.query.name, 'i') }
    }

    return {}
}

function generateAuthorErrorMessage(author, req, action) {
    if (req.body.name == '') { return 'Error: Author name can not be empty' }
    if (!isNaN(req.body.name)) { return 'Error: Author name can not be a number' }
    if (author == null) { return `Error: Unable to ${action} Author` }

    return null
}

module.exports = router