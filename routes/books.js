const express = require('express')
const router = express.Router()
const Book = require('../models/book')
const Author = require('../models/author')
const imageMimeTypes = ['image/jpeg','image/png','image/gif']

// GET: All Books
router.get('/', async (request, response) => {
    let query = Book.find();
    if(request.query.title != null && request.query.title != ''){
        query = query.regex('title', new RegExp(request.query.title, 'i'))
    }

    if(request.query.publishedBefore != null && request.query.publishedBefore != ''){
        query = query.lte('publishedOn', request.query.publishedBefore)
    }

    if(request.query.publishedAfter != null && request.query.publishedAfter != ''){
        query = query.gte('publishedOn', request.query.publishedAfter)
    }

    try {
        const books = await query.exec();
        response.render('books/index', {
            books: books,
            searchOptions: request.query
        })
    } catch (error) {
        response.redirect('/');   
    }
})

// GET: New Book Form
router.get('/new', async (request, response) => {
    renderNewPage(response, new Book())
})

// POST: Create Book
router.post('/', async (request, response) => {
    const book = new Book({
        title: request.body.title,
        author: request.body.author,
        publishedOn: new Date(request.body.publishedOn),
        pageCount: request.body.pageCount,
        description: request.body.description
    })
    saveCover(book, request.body.cover)

    try {
        const newBook = await book.save()
        response.redirect(`books/${newBook.id}`)
    } catch (error) {
        renderNewPage(response, book, true)
    }
})

// GET: Show Book
router.get('/:id', async (request, response) => {
    try {
        const book = await Book.findById(request.params.id)
                               .populate('author')
                               .exec()
        response.render('books/show', {book:book})
    } catch (error) {
        response.redirect('/')
    }
})

// GET: Edit Book
router.get('/:id/edit', async (request, response) => {
    try {
        const book = await Book.findById(request.params.id)
        renderEditPage(response, book)
    } catch (error) {
        console.error(error)
        response.redirect('/')
    }
})

//PUT: Update Book
router.put('/:id', async (request, response) => {
    let book;

    try {
        book = await Book.findById(request.params.id)
        book.title = request.body.title
        book.author = request.body.author
        book.publishedOn = new Date(request.body.publishedOn)
        book.pageCount = request.body.pageCount
        book.description = request.body.description
        if(request.body.cover != null && request.body.cover != '') {
            saveCover(book, request.body.cover)
        }

        await book.save()

        response.redirect(`/books/${book.id}`)
    } catch (error) {
        console.error(error)
        if(book != null) {
            renderEditPage(response, book, true)
        } else {
            response.redirect('/')
        }
    }
})

// DELETE: Book
router.delete('/:id', async (request, response) => {
    let book;
    try {
        book = await Book.findById(request.params.id)
        await book.remove()
        response.redirect('/books')
    } catch (error) {
        if (book != null) { 
            response.render('books/show', {
                book: book,
                errorMessage: 'Unable to remove book from catalog'
            })
        } else {
            response.redirect('/')
        }
    }
})

async function renderNewPage(response, book, hasError = false) {
    renderFormPage(response, book, 'new', hasError)
}

async function renderEditPage(response, book, hasError = false) {
    renderFormPage(response, book, 'edit', hasError)
}

async function renderFormPage(response, book, form, hasError = false) {
    try {
        const authors = await Author.find({})
        const parameters = {
            authors: authors,
            book: book
        }

        if(hasError && form === 'new') parameters.errorMessage = 'Error occured while attempting to create Book'
        if(hasError && form === 'edit') parameters.errorMessage = 'Error occured while attempting to update Book'

        response.render(`books/${form}`, parameters)
    } catch (error) {
        console.error(error)
        response.redirect('/books')
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