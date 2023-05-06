const mongoose = require("mongoose")
//gift mongoose schema
const giftSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    desc: {
        type: String,
        trim: true
    },
    value: {
        type: Number,
        trim: true
    },
    price: {
        type: Number,
        trim: true
    },
    image: {
        type: String,
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

const Gift = mongoose.model('Gift', giftSchema)

module.exports = Gift


