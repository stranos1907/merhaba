const mongoose = require("mongoose")
//package mongoose schema
const packageSchema = mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    sur_name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true
    },
    before:{
        type: Number,
    },
    vip:{
        type: Boolean,
    },
    after:{
        type: Number,
    },
    sku: {
        type: String,
        trim: true
    },
    value: {
        type: Number,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        trim: true
    },
    vipStart:{
        type:Date
    },
    vipEnd:{
        type:Date
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    package: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Package'
    },
    createdAt: {
        type: Date
    }
})
    
const Payment = mongoose.model('Payment', packageSchema);
module.exports = Payment;
