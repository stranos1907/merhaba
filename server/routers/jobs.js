const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const cron = require('cron');
const MessageDialog = require('../models/Message/MessageDialog');
const User = require('../models/User/User');
const MessageTemplate = require('../models/MessageTemplate/MessageTemplate');
const Message = require('../models/Message/Message');
const sendNotification = require('./oneSignal')

var activeJobs = []


//create cron job
router.post('/create', auth, async (req, res) => {
    try {
        let period = req.body.period

        let randomUserCount = req.body.randomUserCount
        let userCount = req.body.userCount
        let messageCount = req.body.userCount

        const job = new cron.CronJob(period, async function(){
            let users = await User.find({fake:{$ne:true},admin:{$ne:true},mod:{$ne:true}}).sort({ createdAt: -1 }).limit(randomUserCount)

            //get * userCount 
            var randomUsers = []
            for (let i = 0; i < userCount; i++) {
                let random = Math.floor(Math.random() * users.length)
                randomUsers.push(users[random])
            }

            //send message to random users
            
            for (let j = 0; j < randomUsers.length; j++) {
                sendMessage(req,randomUsers[j],messageCount)
            }
            
            
        });
        job.start();

        let newId = 0
        if (activeJobs.length > 0) {
            newId = activeJobs[activeJobs.length - 1].data.id + 1
        }
        activeJobs.push({
            job,
            data:{
                id:newId,
                source:period,
                randomUserCount:randomUserCount,
                userCount:userCount,
                messageCount:messageCount
            }
        })
        res.send({id:job.id})
        //console.log(job);
    } catch (e) {
        console.log(e);
    }
})


async function sendMessage(req,user,messageCount){
        try {
        var users = await User.find({fake:true})
        let random = Math.floor(Math.random() * users.length)
        let sender = users[random]
        let receiver = user

        const oldDialog = await MessageDialog.findOne({$or: [{user1: sender._id, user2: receiver._id}, {user1: receiver._id, user2: sender._id}]})
        if (oldDialog) {
            return
        }else{
            let templates = await MessageTemplate.find().limit(messageCount)
            let random = Math.floor(Math.random() * templates.length)
            let template = templates[random]

            let nameTag = "{{name}}"
            let messageText = template.message
            
            //if messageText has name tag
            if (messageText.includes(nameTag)){
                let name = receiver.name
                messageText = messageText.replace(nameTag,name)
            }

            let message = new Message({
                message: messageText,
                sender: sender._id,
                receiver: receiver._id,
                createdAt: new Date()
            })
        
            let dialog = new MessageDialog({
                user1: sender._id,
                user2: receiver._id,
                lastMessage: message._id        
            })
            dialog.lastFake = true
            await dialog.save();
            message.dialog = dialog._id
            await message.save()
            sendNotif(receiver._id,message)
            sendNewMessageToSocket(req,message)
        }

       
        } catch (error) {
            console.log(error);
        }
}

router.get('/list', async (req, res) => {
    try {
        let jobs = activeJobs.map(x=> {
            return x.data
        } )
        res.send(jobs);
    } catch (e) {
        console.log(e);
        res.status(400).send(e)
    }
})

router.post('/stop', async (req, res) => {
    try {
        let id = req.body.id
        //console.log(id);
        let job = activeJobs.find(x=>x.data.id == id)
        //console.log(job);
        job.job.stop()
        activeJobs = activeJobs.filter(x=>x.data.id != id)
        res.send({success:true});
    } catch (e) {
        console.log(e);
    }
})


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



module.exports = router;