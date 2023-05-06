//message mongoose schema
const mongoose = require("mongoose")
const messageSchema = mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    dialog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MessageDialog'
    },
    messageDialog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MessageDialog'
    },
    gift: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gift'
    },
    image:{
        type: String,
        default: null
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    read: {
        type: Boolean,
        default: false
    },
    deleted: {
        type: Boolean,
        default: false
    },
    bloked: {
        type: Boolean,
        default: false
    },
    systemMessage:{
        type: Boolean,
    },
    coinMessage:{
        type: Boolean,
    },
    sendedCoin:{
        type: Number
    },
    createdAt: {
        type: Date
    }
})
const Message = mongoose.model('Message', messageSchema)
module.exports = Message