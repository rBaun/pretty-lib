const express = require('express')
const router = express.Router()
const Book = require('../models/book')
const Author = require('../models/author')
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif']

// GET: All Books
router.get('/', async (req, res) => {
    let query = findBooks(req);

    try {
        const books = await query.exec();
        res.render('books/index', {
            books: books,
            searchOptions: req.query
        })
    } catch {
        res.redirect('/');
    }
})

// GET: New Book Form
router.get('/new', async (req, res) => {
    renderNewPage(res, new Book())
})

// POST: Create Book
router.post('/', async (req, res) => {
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishedOn: new Date(req.body.publishedOn),
        pageCount: req.body.pageCount,
        description: req.body.description
    })
    if (req.body.cover != null && req.body.cover != '') {
        saveCover(book, req.body.cover)
    }
    let errorMessage = generateBookErrorMessage(book, req, 'create')
    console.error(errorMessage)
    try {
        if (errorMessage != null) { throw new Error(errorMessage) }

        const createdBook = await book.save()
        res.redirect(`books/${createdBook.id}`)
    } catch {
        renderNewPage(res, book, true, errorMessage)
    }
})

// GET: Show Book
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
            .populate('author')
            .exec()
        res.render('books/show', { book: book })
    } catch {
        res.redirect('/')
    }
})

// GET: Edit Book
router.get('/:id/edit', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
        renderEditPage(res, book)
    } catch {
        res.redirect('/')
    }
})

//PUT: Update Book
router.put('/:id', async (req, res) => {
    let book
    let errorMessage

    try {
        book = await Book.findById(req.params.id)
        book.title = req.body.title
        book.author = req.body.author
        book.publishedOn = new Date(req.body.publishedOn)
        book.pageCount = req.body.pageCount
        book.description = req.body.description
        if (req.body.cover != null && req.body.cover != '') {
            saveCover(book, req.body.cover)
        }

        errorMessage = generateBookErrorMessage(book, req, 'update')
        if (errorMessage != null) { throw new Error(errorMessage) }

        await book.save()
        res.redirect(`/books/${book.id}`)
    } catch {
        renderEditPage(res, book, true, errorMessage)
    }
})

// DELETE: Book
router.delete('/:id', async (req, res) => {
    let book;
    removeBook: try {
        book = await Book.findById(req.params.id)

        await book.remove()
        res.redirect('/books')
    } catch {
        if (book != null) {
            res.render('books/show', {
                book: book,
                errorMessage: 'Unable to remove book from catalog'
            })
            break removeBook
        }

        res.redirect('/')
    }
})

function findBooks(req) {
    let query = Book.find()

    if (req.query.title && req.query.publishedBefore && req.query.publishedAfter) {
        return query.where('publishedOn')
            .gte(req.query.publishedAfter)
            .lte(req.query.publishedBefore)
            .where('title')
            .regex(new RegExp(req.query.title, 'i'))
    }
    if (req.query.title) { return query.regex('title', new RegExp(req.query.title, 'i')) }
    if (req.query.publishedBefore && req.query.publishedAfter) {
        return query.where('publishedOn')
            .gte(req.query.publishedAfter)
            .lte(req.query.publishedBefore)
    }
    if (req.query.publishedBefore) { return query.lte('publishedOn', req.query.publishedBefore) }
    if (req.query.publishedAfter) { return query.gte('publishedOn', req.query.publishedAfter) }

    return query
}

async function renderNewPage(res, book, hasError = false, errorMessage = null) {
    return renderFormPage(res, book, 'new', hasError, errorMessage)
}

async function renderEditPage(res, book, hasError = false, errorMessage = null) {
    renderFormPage(res, book, 'edit', hasError, errorMessage)
}

async function renderFormPage(res, book, form, hasError = false, errorMessage = null) {
    try {
        const authors = await Author.find({})
        const parameters = {
            authors: authors,
            book: book
        }

        if (errorMessage != null) { parameters.errorMessage = errorMessage }

        res.render(`books/${form}`, parameters)
    } catch {
        res.redirect('/books')
    }
}

function saveCover(book, coverEncoded) {
    if (coverEncoded == null) return
    const cover = JSON.parse(coverEncoded)
    if (cover != null && imageMimeTypes.includes(cover.type)) {
        book.coverImage = new Buffer.from(cover.data, 'base64')
        book.coverImageType = cover.type
    }
}

function generateBookErrorMessage(book, req, action) {
    if (req.body.title == '') { return 'Error: Book title can not be empty' }
    if (req.body.author == null) { return 'Error: Book of the Author was not found. Please try again' }
    if (req.body.publishedOn == null || req.body.publishedOn == '') { return 'Error: Publish date for the book is required' }
    if (req.body.pageCount < 1) { return 'Error: Book page count must be set to at least 1' }
    if (req.body.cover == null || req.body.cover == '') { return 'Error: Book cover is required' }
    if (book == null) { return `Error: Unable to ${action} Book` }

    return null
}

module.exports = router