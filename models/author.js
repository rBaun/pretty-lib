const mongoose = require('mongoose');
const Book = require('./book')

const authorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
})

authorSchema.pre('remove', function(next) {
    Book.find({ author: this.id }, (error, books) => {
        if(error) return next(error)
        if(books.length > 0) return next(new Error('There is still books associated with this author'))

        next();
    })
})

module.exports = mongoose.model('Author', authorSchema)