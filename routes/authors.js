const express = require('express');
const router = express.Router();
const Author = require('../models/author')
const Book = require('../models/book')

// GET: All Authors
router.get('/', async (request, response) => {
    let searchOptions = {};
    if (request.query.name != null && request.query.name !== '') {
        searchOptions.name = new RegExp(request.query.name, 'i')
    }
    try {
        const authors = await Author.find(searchOptions)
        response.render('authors/index', {
            authors: authors,
            searchOptions: request.query
        })
    } catch (error) {
        response.redirect('/')
    }
});

// GET: New Author Form
router.get('/new', (request, response) => {
    response.render('authors/new', { author: new Author() });
});

// POST: Create Author
router.post('/', async (request, response) => {
    const author = new Author({
        name: request.body.name
    })
    try {
        const newAuthor = await author.save()
        response.redirect(`authors/${newAuthor.id}`)
    } catch (error) {
        response.render('authors/new', {
            author: author,
            errorMessage: 'Error occured while attempting to create Author'
        })
    }
});

// GET: Show Author
router.get('/:id', async (request, response) => {
    try {
        const author = await Author.findById(request.params.id)
        const books = await Book.find({ author: author.id }).limit(6).exec()
        
        response.render('authors/show', { 
            author: author, 
            booksByAuthor: books 
        })
    } catch (error) {
        response.redirect('/')
    }
})

// GET: Edit Author
router.get('/:id/edit', async (request, response) => {
    try {
        const author = await Author.findById(request.params.id)
        response.render('authors/edit', { author: author });
    } catch (error) {
        response.redirect('authors')
    }
})

// PUT: Update Author
router.put('/:id', async (request, response) => {
    let author;
    try {
        author = await Author.findById(request.params.id)
        author.name = request.body.name
        await author.save()
        response.redirect(`/authors/${author.id}`)
    } catch (error) {
        if (author == null) {
            response.redirect('/')
        } else {
            response.render('authors/new', {
                author: author,
                errorMessage: 'Error occured while attempting to update Author'
            })
        }
    }
})

// DELETE: Delete Author
router.delete('/:id', async (request, response) => {
    let author;
    try {
        author = await Author.findById(request.params.id)
        await author.remove()
        response.redirect(`/authors`)
    } catch (error) {
        if (author == null) {
            response.redirect('/')
        } else {
            response.redirect(`/authors/${author.id}`)
        }
    }
})

module.exports = router;