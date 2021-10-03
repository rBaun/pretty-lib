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
        // response.redirect(`books/${newBook.id}`)
        response.redirect(`books`)
    } catch (error) {
        renderNewPage(response, book, true)
    }
})

async function renderNewPage(response, book, hasError = false) {
    try {
        const authors = await Author.find({})
        const parameters = {
            authors: authors,
            book: book
        }
        if(hasError) parameters.errorMessage = 'Error occured while attempting to create Book'
        response.render('books/new', parameters)
    } catch (error) {
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