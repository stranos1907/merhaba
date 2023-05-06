//router users
const express = require('express')
const router = new express.Router()
const User = require('../models/User/User')
const auth = require('../middleware/auth')
const bcrypt = require('bcryptjs')
const Message = require('../models/Message/Message')
const MessageDialog = require('../models/Message/MessageDialog')
const sendNotification = require('./oneSignal')
const { sendOtp } = require('./sms');
const Options = require('../models/Package/Options')
var defaultCoin  = 4
  
//getOptions
router.get('/options', async (req, res) => {
    try {
        const options = await Options.findOne({},{googleKey:1,instagramCoin:1,creditText:1,creditUrl:1})
        res.send(options)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.post('/register', async (req, res) => {
    const user = new User(req.body)
    try {
        user.coins = defaultCoin
        user.createdAt = new Date() 
        await user.save()

        const token = await user.createAuthToken()
        sendMessageAfter(user,req)
        user.token = token
        res.send(user)
        
    } catch (e) {
        console.log(e);
        res.status(400).send(e)
    }
})

var messages = [
    "Merhaba",
    "selam",
    "naber",
]

async function sendMessageAfter(user,req){

    setTimeout(async() => {
        try {
            var users = await User.find({fake:true})
        let random = Math.floor(Math.random() * users.length)
        let sender = users[random]
        let receiver = user

        const oldDialog = await MessageDialog.findOne({$or: [{user1: sender, user2: receiver}, {user1: receiver, user2: sender}]})
        
        
        if (oldDialog) {
            return
        }

        let message = new Message({
            message: "Merhaba",
            message: messages[Math.floor(Math.random() * messages.length)],
            sender: sender,
            receiver: receiver,
            createdAt: new Date()
        })
    
        let dialog = new MessageDialog({
            user1: sender,
            user2: user,
            lastMessage: message._id        
        })
        dialog.lastFake = true
        await dialog.save();
        message.dialog = dialog._id
        await message.save()
        sendNotif(receiver,message)
        sendNewMessageToSocket(req,message)
        } catch (error) {
            console.log(error);
        }
    },120000)
}

function sendNewMessageToSocket(req,message) {
    let io = req.app.get('socketio');
    let receiver = message.receiver.toString()
    io.to(receiver).emit('dialog/new-message', message);
}

async function sendNotif(receiver,message) {
    try {
        let receiverObj = await User.findById(receiver,{ftoken:1})
        let senderObj = await User.findById(message.sender,{name:1})

        if (receiverObj == null) {
            return
        }
        if (receiverObj.ftoken == null) {
            return
        }
        if (receiverObj.ftoken == "") {
            return
        }
        if (senderObj == null) {
            return
        }
        if (senderObj.name == null) {
            return
        }
    
        let text = senderObj.name + " sana bir mesaj gönderdi."
        sendNotification.sendNotification({
            title: "Yeni Mesaj Geldi",
            message:text,
            ftoken:receiverObj.ftoken
        })
    } catch (error) {
      console.log(error);  
    }
    
}

router.post('/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.username, req.body.password)
        const token = await user.createAuthToken()
        user.token = token
        res.send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post("/google-login", async (req, res) => {
    // //console.log("Login" + req.body);
    try {
      const { username, name,sur_name , googleId } = req.body
      const user = await User.findOne({ email: username })
      if (!user) {
        let newUser = new User({
          name: name,
          sur_name:sur_name,
          email: username,
          coins:defaultCoin, 
          googleToken: googleId
        })
        newUser.createdAt = new Date() 
        await newUser.save()
        const token = await newUser.createAuthToken()
        newUser.token = token
        newUser.fromGoogle = true
        sendMessageAfter(newUser,req)
        res.cookie("token", token).send(newUser)
      } else {
        const token = await user.createAuthToken()
        user.token = token
        res.cookie("token", token).send(user)
      }
    } catch (error) {
      console.log(error);
      res.status(400).send({ error, message: "login failed. Check your email and password" })
    }
})
  
router.get('/me',auth, async (req, res) => {
    try {
        let user = await User.findById(req.user._id)
        res.send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/send-otp', async function (req, res) {
    let phone = req.body.phone

    let oldUser = await User.findOne({ phone: phone },{phone:1})

    if (oldUser) {
        res.status(200).send({status:"error",message:"Bu telefon numarası zaten kayıtlı"})
        return
    }

    sendOtp(phone,(result)=>{
      let status = result.status == "ok" ? 200 : 400
      res.status(status).send(result)
    })
});


router.post('/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.put('/update', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ["_id",'name', 'email', 'age', 'hobbies']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }
    try {
        let user = await User.findById(req.body._id)
        updates.forEach((update) => user[update] = req.body[update])
        await user.save()
        res.send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.put('/update-profile', auth, async (req, res) => {
   try {

    let rawPassword = req.body.password
    var newPassword = null
    if(rawPassword != null){
        newPassword  = await bcrypt.hash(rawPassword, 8)
        req.body.password = newPassword
    }
    
    let profile = await User.findByIdAndUpdate({ _id: req.body._id }, { $set: req.body }, { new: true, useFindAndModify: false })
    res.send(profile)
    } catch (e) {
        console.log(e);
        res.status(400).send(e)
    }
})

//is user online
router.get('/online', auth, async (req, res) => {
    try {
        let _id = req.query._id
        const user = await User.findById(_id)
        if (!user) {
            return res.status(404).send()
        }
        res.send(user)
    } catch (e) {
        res.status(500).send()
    }
})

//like user
router.put('/like', auth, async (req, res) => {
    try {
        //if user already liked
        if(req.user.likes.includes(req.body.id)){
            req.user.likes = req.user.likes.filter((like) => {
                return like !== req.body.id
            })
            await req.user.save()
            res.send(req.user)
        }else{
            req.user.likes = req.user.likes.concat(req.body.id)
            let user = await User.findById(req.body.id)
            //count up user like
            user.like = user.like + 1
            await user.save()
            await req.user.save()
            res.send(user)
        }
    } catch (e) {
        res.status(400).send(e)
    }
})

//dislike user
router.put('/dislike', auth, async (req, res) => {
    try {
        //if user already disliked
        if(req.user.likes.includes(req.body.id)){
            req.user.likes = req.user.likes.filter((like) => {
                return like !== req.body.id
            })
            await req.user.save()
            res.send(req.user)
        }else{
            req.user.likes = req.user.likes.concat(req.body.id)
            let user = await User.findById(req.body.id)
            //count up user dislike
            user.like = user.like - 1
            await user.save()
            await req.user.save()
            res.send(user)
        }
    } catch (e) {
        res.status(400).send(e)
    }
})


//profiles
router.get('/profiles', auth, async (req, res) => {
    try {
        let users = await User.find({fake:true,online:true}).sort({_id:-1})

        //randomize users
    
        if (!users) {
            return res.status(404).send()
        }
        users = users.sort(() => Math.random() - 0.5)
        res.send(users)
    }catch(e){
        res.status(400).send(e)
    }
})

module.exports = router