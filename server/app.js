const express = require('express')
const cors = require('cors')
const fileUpload = require('express-fileupload');
const useragent = require('express-useragent')

const router_users = require('./routers/users')
const router_messages = require('./routers/messages')
const router_gifts = require('./routers/gifts')
const router_hobbies = require('./routers/hobbies')
const router_sliders = require('./routers/sliders')
const router_packages = require('./routers/package')
const router_admin = require('./routers/admin')
const router_fileHelper = require('./routers/fileHelper')
const router_jobs = require('./routers/jobs')
const jwt = require('jsonwebtoken')

const config = require("../config") ;
const User = require('./models/User/User');
const Message = require('./models/Message/Message');
const Gift = require('./models/Gift/Gift');
const MessageDialog = require('./models/Message/MessageDialog');
const Options = require('./models/Package/Options');
const { sendNotification } = require('./routers/oneSignal');
const port = config.PORT

var defaultCoin  = 4
var messageCoin  = 1
var imageCoin  = 5

const app = express()
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
}));
app.use(useragent.express());
app.use(express.json({limit: '50mb'}))
app.use(cors())

app.use("/users", router_users)
app.use("/messages", router_messages)
app.use("/gifts", router_gifts)
app.use("/hobbies", router_hobbies)
app.use("/sliders", router_sliders)
app.use("/packages", router_packages)
app.use("/admin", router_admin)
app.use("/admin/jobs", router_jobs)
app.use(router_fileHelper)


require('./db/db')


app.get("/",(req,res)=>{
    res.send("Bu alana girmek sakıncalı ve yasaktır.")
})

var http = require('http').createServer(app);
var io = require('socket.io')(http,{
    cors: {
        origin: '*',
      }
});
app.set('socketio', io);
io.on('connection',async function(socket){
  //  console.log('a user connected');
    socket.on("subscribe/connect",(data)=>{
        //console.log("subscribe/connect");
        let token = data.token
        if(token != null){
          //  console.log("token is not null");
          try {
            const verify = jwt.verify(token, config.PRIVATE_KEY)
           // console.log("verify",verify._id);
          if(verify != null){
            User.findOne({ _id: verify._id, 'tokens.token': token },{tokens:1}).then(user =>{
              if (!user) {
                   // console.log("user not found 2");
                  socket.emit("subscribe/callback",{status:"fail",message:"User not found!"})
              }else{
                let room = user._id
                socket.join(room.toString())
                //set user online
               // console.log("user online",user._id);
                User.findOneAndUpdate({_id:user._id},{$set:{online:true,socket:socket.id}}).then(user=>{
                    socket.emit("subscribe/callback",{status:"success",message:"User connected!"})
                }).catch(e=>{
                    socket.emit("subscribe/callback",{status:"fail",message:"User not found!"})
                })
              }
            })
          }else{
        //   console.log("token not valid");
            socket.emit("subscribe/callback",{status:"fail",message:"User not found!"})
          }
          } catch (error) {
            if (error.name == "TokenExpiredError") {
              socket.emit("subscribe/callback",{status:"fail",code:403,message:"Oturum süreniz dolmuştur. Lütfen tekrar oturum açın."})
              return
            }
          }
        }
      })

     socket.on("subscribe/disconnect",(data)=>{
        let socketId = socket.id
        User.findOneAndUpdate({socket:socketId},{online:false,socket:null},{new: true})
     })

     socket.on("subscribe/admin",(data)=>{
        let _id = data._id
        socket.join(_id.toString())
      //  console.log("admin connected");
     })

     socket.on("dialog/read",(data)=>{
        let id = data._id
        Message.findOneAndUpdate({_id:id},{$set:{read:true}}).then(user=>{
        }).catch(e=>{
         //   console.log("user not found");
        })
     })

     socket.on("new-message",async(data)=>{
        //console.log(data);
        newMessage(io,socket,data)
     })

    socket.on('disconnect', function(){
      //  console.log('user disconnected');
     //   console.log("socket id",socket.id);
        let socketId = socket.id
        User.findOneAndUpdate({socket:socketId},{$set:{online:false,socket:""}}).then(user=>{
          //  console.log("user offline",user._id);
        }).catch(e=>{
          //  console.log("user not found");
        })
    });
});

//todo
async function sendNewMessageToAdmin(io,dialog,message) {
  console.log("Dilaog send in");
  let senderObj = await User.findById(dialog.user1,{fake:1,name:1})
  let receiverObj = await User.findById(dialog.user2,{fake:1,name:1})
  var send = true
  // if(senderObj != null && senderObj.fake == true){
  //     send = true
  // }
  // if(receiverObj != null && receiverObj.fake == true){
  //     send = true
  // }
  
  if(send){
    let admins = await User.find({admin:true},{_id:1,ftoken:1})
    if (admins != null) {
        for (let i = 0; i < admins.length; i++) {
            const element = admins[i];
            
            let receiver = element._id.toString()

            let messageObj = await  Message.findById(message).populate('sender')
            .populate("dialog")
            .populate('receiver')

            //console.log("messageObj");
            //console.log(messageObj);

            io.to(receiver).emit('dialog/new-message', {dialog:dialog._id,message:messageObj});

            if (element.ftoken != null) {
              let text = senderObj.name + " sana bir mesaj gönderdi."
                let n = {
                    title: "Yeni Mesaj Geldi",
                    message:text,
                    ftoken:element.ftoken
                }
                sendNotification(n);
            }

        }
    }
}
}

async function updateUserCoins(io,data){
  
  var  options = await Options.findOne({})
  if (!options) {
    options =  {
      defaultCoin:4,
      messageCoin:1,
      imageCoin:5,
      instagramCoin:1,
      messageDelay:1,//min
    }
  }
  
  let user = await User.findById(data.sender,{coins:1})

  if (data.gift  != null) {
      let gift = await Gift.findById(data.gift)
      user.coins = user.coins - gift.value
      await user.save()
  }else if(data.image != null){
      user.coins = user.coins - options.imageCoin
      await user.save()
  }else{
      user.coins = user.coins - options.messageCoin;
      await user.save();
  }
}

async function newMessage(io,socket,data) {
  try {    
    var  options = await Options.findOne({})
    if (!options) {
      options =  {
        defaultCoin:4,
        messageCoin:1,
        imageCoin:5,
        instagramCoin:1,
        messageDelay:1,//min
      }
    }


    var sender =  await User.findById(data.sender,{coins:1})

  //  console.log(req.body);
    if (data.gift  != null) {
        let gift = await Gift.findById(data.gift)
        if (gift != null) {
            if (sender.coins >= gift.value) {
                //do nothing
            }else{
                socket.emit("reject-message",{status:"fail",message:"Bu işlemi yapmak için yeterli jeton bulunmamaktadır."})
                return
            }
        }
    }else if(data.image != null){
        if(sender.coins < options.imageCoin){
          socket.emit("reject-message",{status:"fail",message:"Bu işlemi yapmak için yeterli jeton bulunmamaktadır."})
            return 
        }
    }else if (sender.coins < options.messageCoin) {

      // console.log("sender coins",sender.coins );
      // console.log("message coins",options.messageCoin );


      //   console.log("message coins");
        socket.emit("reject-message",{status:"fail",message:"Bu işlemi yapmak için yeterli jeton bulunmamaktadır."})
        return
    }

    const message = new Message({
        ...data,
        sender: sender._id,
        dialog:null,
        createdAt:new Date()
    })
    

    //console.log("message");

    //sendNotificationIfNotOnline(req,message);
    //update dialog
    const dialog = await MessageDialog.findOne({$or: [{user1: sender._id, user2: data.receiver}, {user1: data.receiver, user2: sender._id}]})
    if (dialog) {
        dialog.lastMessage = message._id;
        dialog.lastFake = false
        await dialog.save();
        //console.log("message2");
        message.dialog = dialog._id;
        await message.save();
        updateUserCoins(io,data)
        sendNewMessageToAdmin(io,dialog,message._id)
        //replyAfter(dialog,dialog.user2,dialog.user1)
    } else {

      console.log("Dilaog null");
        const newDialog = new MessageDialog({
            user1: sender._id,
            user2: data.receiver,
            lastMessage: message._id
        })
        newDialog.lastFake = false
        //console.log("message3");
        await newDialog.save();
        message.dialog = newDialog._id
        updateUserCoins(io,data)
        await message.save();
        console.log("Dilaog null send");
        sendNewMessageToAdmin(io,newDialog,message._id)
        //replyAfter(newDialog,newDialog.user2,newDialog.user1)
    }
    message.sender = null
    message.receiver = null
} catch (e) {
    console.log(e);
}
}

http.listen(port, () => {
    console.log('Server is up on port ' + port)
})
