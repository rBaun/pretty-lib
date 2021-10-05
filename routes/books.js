const express = require('express')
const router = express.Router()
const Book = require('../models/book')
const Author = require('../models/author')
const imageMimeTypes = ['image/jpeg','image/png','image/gif']

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
    saveCover(book, req.body.cover)

    try {
        const newBook = await book.save()
        res.redirect(`books/${newBook.id}`)
    } catch (error) {
        renderNewPage(res, book, true)
    }
})

// GET: Show Book
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
                                .populate('author')
                                .exec()
        res.render('books/show', {book:book})
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
    let book;
    updateBook: try {
        book = await Book.findById(req.params.id)

        book.title = req.body.title
        book.author = req.body.author
        book.publishedOn = new Date(req.body.publishedOn)
        book.pageCount = req.body.pageCount
        book.description = req.body.description
        if(req.body.cover != null && req.body.cover != '') {
            saveCover(book, req.body.cover)
        }

        await book.save()
        res.redirect(`/books/${book.id}`)
    } catch {
        if(book != null) { renderEditPage(res, book, true); break updateBook }

        res.redirect('/')
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

    if(req.query.title) { return query.regex('title', new RegExp(req.query.title, 'i'))}
    if(req.query.publishedBefore && req.query.publishedAfter) { 
        return query.where('publishedOn')
                        .gte(req.query.publishedAfter)
                        .lte(req.query.publishedBefore)
    }
    if(req.query.publishedBefore){ return query.lte('publishedOn', req.query.publishedBefore)}
    if(req.query.publishedAfter){ return query.gte('publishedOn', req.query.publishedAfter) }

    return query
}

async function renderNewPage(res, book, hasError = false) {
    renderFormPage(res, book, 'new', hasError)
}

async function renderEditPage(res, book, hasError = false) {
    renderFormPage(res, book, 'edit', hasError)
}

async function renderFormPage(res, book, form, hasError = false) {
    try {
        const authors = await Author.find({})
        const parameters = {
            authors: authors,
            book: book
        }

        if(hasError && form === 'new') parameters.errorMessage = 'Error occured while attempting to create Book'
        if(hasError && form === 'edit') parameters.errorMessage = 'Error occured while attempting to update Book'

        res.render(`books/${form}`, parameters)
    } catch {
        res.redirect('/books')
    }
}

function saveCover(book, coverEncoded) {
    if(coverEncoded == null) return
    const cover = JSON.parse(coverEncoded)
    if(cover != null && imageMimeTypes.includes(cover.type)) {
        book.coverImage = new Buffer.from(cover.data, 'base64')
        book.coverImageType = cover.type
    }
}

module.exports = router