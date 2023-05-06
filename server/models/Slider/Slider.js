const mongoose = require("mongoose")
//Slider mongoose schema
const sliderSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    desc:{
        type: String        
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

const Slider = mongoose.model('Slider', sliderSchema)

module.exports = Slider
