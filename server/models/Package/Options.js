const mongoose = require("mongoose")
//package mongoose schema
const packageSchema = mongoose.Schema({
    defaultCoin: {
        type: Number,
    },
    messageCoin: {
        type: Number,
    },
    imageCoin: {
        type: Number,
    },
    instagramCoin:{
        type: Number,
    },
    messageDelay:{
        type: Number,
    },
    googleKey:{
        type: String
    },
    requestToken:{
        type: Boolean
    },
    creditUrl:{
        type: String
    },
    creditText:{
        type: String
    }    
})
    
const Options = mongoose.model('Options', packageSchema);
module.exports = Options;
