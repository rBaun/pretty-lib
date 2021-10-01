const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Book = require('../models/book')
const Author = require('../models/author')
const uploadPath = path.join('public', Book.coverImageBasePath)
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg']
const upload = multer({
    dest: uploadPath,
    fileFilter: (request, file, callback) => {
        callback(null, imageMimeTypes.includes(file.mimetype))
    }
})

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
router.post('/', upload.single('cover'), async (request, response) => {
    const fileName = request.file != null ? request.file.filename : null
    const book = new Book({
        title: request.body.title,
        author: request.body.author,
        publishedOn: new Date(request.body.publishedOn),
        pageCount: request.body.pageCount,
        coverImageName: fileName,
        description: request.body.description
    })

    try {
        const newBook = await book.save()
        // response.redirect(`books/${newBook.id}`)
        response.redirect(`books`)
    } catch (error) {
        if(book.coverImageName != null) {
            removeBookCover(book.coverImageName);
        }
        renderNewPage(response, book, true)
    }
})

function removeBookCover(fileName) {
    fs.unlink(path.join(uploadPath, fileName), error => {
        console.error(error);
    })
}

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

module.exports = router