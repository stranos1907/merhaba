const mongoose = require("mongoose")
//package mongoose schema
const packageSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    desc: {
        type: String,
        trim: true
    },
    sku: {
        type: String,
        trim: true
    },
    vip: {
        type: Boolean,
    },
    value: {
        type: Number,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
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
    
const Package = mongoose.model('Package', packageSchema);
module.exports = Package;
