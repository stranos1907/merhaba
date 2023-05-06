const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {isEmail} = require('validator')



const config = require("../../../config");

const userSchema = mongoose.Schema({
  name: {
        type: String,
        required: true,
        trim: true
    },
    sur_name: {
        type: String,
    },
    title: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    desc: {
        type: String,
        trim: true
    },
    like: {
        type: Number,
    },
    likes: {
        type: [mongoose.Schema.Types.ObjectId],
    },
    blockedUsers:{
        type: [mongoose.Schema.Types.ObjectId],
    },
    phone: {
        type: String
    },
    pp: {
        type: String
    },
    bigPhoto: {
        type: String
    },
    city: {
        type: String
    },
    images: {
        type: [String]
    },
    hobbies: {
        type: [Object]
    },
    age: {
        type: Number
    },
    gender: {
        //0 unknown, 1 woman 2 man
        type: Number
    },
    birthday: {
        type: Date
    },
    fake:{
        type: Boolean,
        default: false
    },
    admin:{
        type: Boolean,
        default: false
    },
    mod:{
        type: Boolean,
        default: false
    },
    coins: {
        type: Number,
        default: 4
    },
    password: {
        type: String,
        minLength: config.MIN_PASSWORD_LENGTH
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    token: {
          type: String
    },
    googleToken:{
        type: String,
        default:null
    },
    fromGoogle:{
        type: Boolean
    },
    ftoken: {
        type: String
    },
    socket: {
        type: String
    },
    online: {
        type: Boolean,
        default: false
    },
    active: {
      type:Boolean,
      default:true
    },
    banned:{
        type: Boolean,
        default: false
    },
    audio_note:{
        type: String
    },
    instagram:{
        type: String
    },
    vip:{
        type: Boolean,
    },
    vipStart:{
        type:Date
    },
    vipEnd:{
        type:Date
    },
    createdAt: {
        type: Date
    }
})

userSchema.pre('save', async function (next) {
    const user = this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})

userSchema.methods.createAuthToken = async function() {
    let user = this
    var token  = jwt.sign({_id: user._id,name:user.name,email:user.email,admin:user.admin,mod:user.mod}, config.PRIVATE_KEY)
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({$or:[
        {email},
        {phone:email}
    ]} )
    if (!user) {
        throw new Error({ error: 'Invalid login credentials' })
    }
    if (!user.active) {
        throw new Error({ error: 'In active User' })
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password)
    if (!isPasswordMatch) {
        throw new Error({ error: 'Invalid login credentials' })
    }
    return user
}

const User = mongoose.model('User', userSchema)

module.exports = User
