const mongoose = require("mongoose")
//notification mongoose schema
const notificationSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    body: {
        type: String,
        trim: true
    },
    header:{
        type:String
    },
    type: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})
const Notification = mongoose.model('Notification', notificationSchema)
module.exports = Notification