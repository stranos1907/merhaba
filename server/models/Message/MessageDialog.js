const mongoose = require("mongoose")
//messageDialog mongoose schema
const messageDialogSchema = mongoose.Schema({
    user1: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    user2: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    fake:{
        type: Boolean,
        default: false
    },
    lastFake:{
        type: Boolean,
        default: false
    },
    messages:{
        type: [Object],
    },
    unReadCount:{
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})
const MessageDialog = mongoose.model('MessageDialog', messageDialogSchema)

messageDialogSchema.statics.findDialog = async (user) => {
    const dialog = await MessageDialog
    .findOne({$or: [{user1: user}, {user2: user}]})
    .populate('lastMessage')
    .populate('user1')
    .populate('user2')
    if (!dialog) {
        const dialog = await MessageDialog.findOne({user1: user2, user2: user1})
        if (!dialog) {
            return null
        }
        return dialog
    }
    return dialog
}



module.exports = MessageDialog


