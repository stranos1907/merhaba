const mongoose = require("mongoose")
//hobby mongoose schema
const hobbySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true,
        trim: true
    },
    index: {
        type: Number,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})
const Hobby = mongoose.model('Hobby', hobbySchema)
module.exports = Hobby
