//router messages
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Gift = require('../models/Gift/Gift');
const Message = require('../models/Message/Message');
const MessageDialog = require('../models/Message/MessageDialog');
const Options = require('../models/Package/Options');
const { rawListeners } = require('../models/User/User');
const User = require('../models/User/User');
const sendNotification = require('./oneSignal');
var defaultCoin  = 4
var messageCoin  = 1
var imageCoin  = 5


//get all messages
router.get('/list', auth, async (req, res) => {
    try {
        let dialog = req.query.dialog

        if (dialog != null) {
            const messages = await Message.find({dialog: dialog})
            .populate('sender')
            .populate("dialog")
            .populate('receiver')
            .sort({createdAt: -1})
            res.send(messages);
        }else{
            let profile = req.query.profile
            if (profile != null) {
                const dialog = await MessageDialog.findOne({$or: [{user1: req.user._id, user2: profile}, {user1: profile, user2: req.user._id}]})
                if (dialog != null) {
                    const messages = await Message.find({dialog: dialog._id})
                    .populate('sender')
                    .populate("dialog")
                    .populate('receiver')
                    .sort({createdAt: -1})
                    
                    var newDialog = await MessageDialog.findById(dialog._id)
                    .populate({
                        path: 'lastMessage',
                        select:{sender:1,receiver:1,message:1,blocked:1,deleted:1},
                        populate: [{ path: 'sender',select:{name:1,sur_name:1,age:1,pp:1,online:1} },{ path: 'receiver',select:{name:1,sur_name:1,age:1,pp:1,online:1} }],
                    })
                    .populate('user1')
                    .populate('user2')

                    if (messages != null) {
                        messages[0].messageDialog = newDialog
                    }

                    res.send(messages);
                }
            }
        }
        
    } catch (e) {
        res.status(500).send(e);
    }
})

//get all dialogs
router.get('/dialogs', auth, async (req, res) => {
    try {
        const dialogs = await MessageDialog.find({$or: [{user1: req.user._id}, {user2: req.user._id}]})    
        .populate({
            path: 'lastMessage',
            select:{sender:1,receiver:1,message:1,blocked:1,deleted:1},
            populate: [{ path: 'sender',select:{name:1,sur_name:1,age:1,pp:1,online:1} },{ path: 'receiver',select:{name:1,sur_name:1,age:1,pp:1,online:1} }],
        })
        .populate('user1')
        .populate('user2')
        .sort({createdAt: -1})
        res.send(dialogs);
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
})

router.post('/unReadCount', auth, async (req, res) => {
    try {
        let ids = req.body.ids
        if (ids == null) {
            res.send([])
            return
        }
        var response = []
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            let messages = await Message.find({receiver:req.user._id,dialog:id,read:{$ne:true}})
         //   console.log(messages);
            if(messages != null){
                response.push({_id:id,count:messages.length})
            }
        }
      //  console.log(response);
        res.send(response);
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
})

router.get('/update-coin', auth,getOptions, async (req, res) => {
    try {
        let user = await User.findById(req.user._id,{coins:1})

        let instagramCoin = req.options.instagramCoin ?? 1
        
        //if user.coins not enought to instagramcoin
        if (user.coins < instagramCoin) {
            res.status(400).send({message:"Bu işlemi yapmak için yeterli jeton bulunmamaktadır."})
            return
        }

        user.coins = user.coins - instagramCoin;
        await user.save();
        res.send({});
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
})

//options middleware like auth



async function updateUserCoins(req){
    let user = await User.findById(req.user._id,{coins:1})

    if (req.body.gift  != null) {
        let gift = await Gift.findById(req.body.gift)
        user.coins = user.coins - gift.value
        await user.save()
    }else if(req.body.image != null){
        user.coins = user.coins - req.options.imageCoin ?? imageCoin
        await user.save()
    }else{
        user.coins = user.coins - req.options.messageCoin ?? messageCoin
        await user.save();
    }
}

//add new message
router.post('/add', auth,getOptions, async (req, res) => {
    try {
        var sender = await User.findById(req.user._id,{coins:1})
    
      //  console.log(req.body);
        if (req.body.gift  != null) {
            let gift = await Gift.findById(req.body.gift)
            if (gift != null) {
                if (sender.coins >= gift.value) {
                    //do nothing
                }else{
                    res.send({error: 'Bu işlemi yapmak için yeterli jeton bulunmamaktadır.'});
                    return
                }
            }
        }else if(req.body.image != null){
            if(sender.coins < imageCoin){
                res.send({error: 'Bu işlemi yapmak için yeterli jeton bulunmamaktadır.'});
                return 
            }
        }else if (sender.coins < messageCoin) {
            res.send({error: 'Bu işlemi yapmak için yeterli jeton bulunmamaktadır.'});
            return
        }

        const message = new Message({
            ...req.body,
            sender: req.user._id,
            dialog:null,
            createdAt:new Date()
        })
        
        //sendNotificationIfNotOnline(req,message);
        //update dialog
        const dialog = await MessageDialog.findOne({$or: [{user1: req.user._id, user2: req.body.receiver}, {user1: req.body.receiver, user2: req.user._id}]})
        if (dialog) {
            dialog.lastMessage = message._id;
            dialog.lastFake = false
            await dialog.save();
            message.dialog = dialog._id;
            await message.save();
            updateUserCoins(req)
            sendNewMessageToAdmin(req,dialog,message._id)
            //replyAfter(dialog,dialog.user2,dialog.user1)
        } else {
            const newDialog = new MessageDialog({
                user1: req.user._id,
                user2: req.body.receiver,
                lastMessage: message._id
            })
            newDialog.lastFake = false
            await newDialog.save();
            message.dialog = newDialog._id
            updateUserCoins(req)
            await message.save();
            sendNewMessageToAdmin(req,newDialog,message._id)
            //replyAfter(newDialog,newDialog.user2,newDialog.user1)
        }  
        message.sender = null
        message.receiver = null
        res.status(200).send(message); 
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
})

router.put("/update",auth, async (req, res) => {
    //console.log("---------------------------update message---------------------------");
    //console.log(req.body);
    try {
        if (req.body.sendedCoin != null && req.body.sendedCoin != undefined && req.body.sendedCoin > 0) {
            let user = await User.findById(req.user._id,{coins:1})
            user.coins = user.coins - req.body.sendedCoin
            await user.save()
        }
        const message = await Message.findOneAndUpdate({_id: req.body._id}, {$set:req.body}, {new: true});
        res.send(message);
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
})

var messages = [
    "Merhaba",
    "Selam",
    "naber"
]
async function replyAfter(dialog,sender,receiver) {
    //set timeout
    setTimeout(async() => {
        let message = new Message({
            message: messages[Math.floor(Math.random() * messages.length)],
            sender: sender,
            receiver: receiver,
            dialog: dialog._id
        })
        await message.save();
    },3000)
}

function sendNotificationIfNotOnline(req,message) {
    let sender = User.findById(message.sender,{name: 1});
    let receiver  = User.findById(message.receiver,{online: 1,ftoken: 1});
    if (!receiver.online) {
        sendNotification(receiver.ftoken, sender.name);
    }
}

function sendNewMessageToSocket(req,message) {
    let io = req.app.get('socketio');
    let receiver = req.body.receiver.toString()
    io.to(receiver).emit('newMessage', message);
}

async function sendNewMessageToAdmin(req,dialog,message) {

    let senderObj = await User.findById(dialog.user1,{fake:1,name:1})
    let receiverObj = await User.findById(dialog.user2,{fake:1,name:1})
    var send = false
    if(senderObj != null && senderObj.fake == true){
        send = true
    }
    if(receiverObj != null && receiverObj.fake == true){
        send = true
    }
    
    if(send){
        let admins = await User.find({admin:true},{_id:1,ftoken:1})
        if (admins != null) {
            for (let i = 0; i < admins.length; i++) {
                const element = admins[i];
                let io = req.app.get('socketio');
                let receiver = element._id.toString()

                let messageObj = await  Message.findById(message).populate('sender')
                .populate("dialog")
                .populate('receiver')
                io.to(receiver).emit('dialog/new-message', {dialog:dialog._id,message:messageObj});

                if (element.ftoken != null) {
                    let n = {
                        title: senderObj.name + " sana bir mesaj gönderdi.",
                        message:messageObj.message,
                        ftoken:element.ftoken
                    }
                    sendNotification.sendNotification(n);
                }

            }
        }
    }
}

async function getOptions(req, res, next) {
    let options;

    try {
        options = await Options.findOne({})
        if (options == null) {
            req.options =  {
                defaultCoin:4,
                messageCoin:1,
                imageCoin:5,
                instagramCoin:1,
                messageDelay:1,//min
            }
        }else{
            req.options = options;
        }
        next()
    } catch (err) {
        req.options =  {
            defaultCoin:4,
            messageCoin:1,
            imageCoin:5,
            instagramCoin:1,
            messageDelay:1,//min
        }
        next()
    }
}

module.exports = router;