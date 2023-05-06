//message mongoose schema
const mongoose = require("mongoose")
const messageSchema = mongoose.Schema({
    name:{
        type: String,
        default: null
    },
    title:{
        type: String,
        default: null
    },
    image:{
        type: String,
        default: null
    },
    message:{
        type: String,
        default: null
    },
    createdAt: {
        type: Date
    }
})
const VipSlider = mongoose.model('VipSlider', messageSchema)
module.exports = VipSlider