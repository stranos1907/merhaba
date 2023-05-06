//message mongoose schema
const mongoose = require("mongoose")
const messageSchema = mongoose.Schema({
    message:{
        type: String,
        default: null
    },
    createdAt: {
        type: Date
    }
})
const MessageTemplate = mongoose.model('MessageTemplate', messageSchema)
module.exports = MessageTemplate