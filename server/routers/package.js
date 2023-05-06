//package router
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Package = require('../models/Package/Package');
const Payment = require('../models/Package/Payment');
const VipPackage = require('../models/Package/VipPackage');
const User = require('../models/User/User');
const validatePurchase = require('./googleValidator');

//get all packages
router.get('/list', auth, async (req, res) => {
    try {
        const packages = await Package.find({vip:{$ne:true}})
        .sort({index: 1})
        res.send(packages);
    } catch (e) {
        res.status(500).send(e);
    } 
})

router.get('/list-vip', auth, async (req, res) => {
    try {
        const packages = await Package.find({vip:true})
        .sort({index: 1})
        console.log(packages);
        res.send(packages);
    } catch (e) {
        res.status(500).send(e);
    }
})

//add new package
router.post('/add', auth, async (req, res) => {
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

//add new package
router.post('/add-vip-package', auth, async (req, res) => {
    const package = new VipPackage({
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

//update package
router.put('/update-vip-package', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["_id",'name', 'description', 'price', 'images'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }
    try {
        const package = await VipPackage.findOne({_id: req.body._id, user: req.user._id});
        if (!package) {
            return res.status(404).send();
        }
        updates.forEach((update) => package[update] = req.body[update]);
        await package.save();
        res.send(package);
    } catch (e) {
        res.status(400).send(e);
    }
})


//buy
router.post('/buy-vip-package', auth, async (req, res) => {
    try {
        let user = await User.findById(req.user._id,{name:1,sur_name:1,email:1,coins:1})
        let package = await Package.findById(req.body._id)

        let sku = package.sku
        let token = req.body.googleKey

        console.log(token);
        // let result = await validatePurchase(sku, token)

        // if (!result) {
        //      return res.status(403).send({message:"Bu satınalma işlemi geçerli değil."});
        // }
        
        let vipStart = new Date();
        let vipEnd = new Date(vipStart);
        vipEnd.setDate(vipEnd.getDate() + package.value);



        let paymentPayload = {
            name: user.name,
            sur_name: "",
            email: user.email,
            vipStart,
            vipEnd,
            sku: package.sku,
            value: package.value,
            price: package.price,
            user: req.user._id,
            package: package._id,
            vip:true,
            createdAt: new Date()
        }

        let payment = new Payment(paymentPayload)
        await payment.save()
        user.vipStart = vipStart
        user.vipEnd = vipEnd
        await user.save()
        res.send(package)

       // console.log("Payment: ", payment);
    }catch(e){
        console.log(e);
        res.status(400).send(e)
    }
})

//update package
router.put('/update', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["_id",'name', 'description', 'price', 'images'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }
    try {
        const package = await Package.findOne({_id: req.body._id, user: req.user._id});
        if (!package) {
            return res.status(404).send();
        }
        updates.forEach((update) => package[update] = req.body[update]);
        await package.save();
        res.send(package);
    } catch (e) {
        res.status(400).send(e);
    }
})

//router test buy
router.post('/test-buy', async (req, res) => {

    const package = await Package.findOne({_id: req.body._id});    
    if (!package) {
        return res.status(404).send();
    }
    let sku = package.sku
    let token = req.body.googleKey
    console.log(token);
    let result = await validatePurchase(sku, token)

    if (!result) {
         return res.status(403).send({message:"Bu satınalma işlemi geçerli değil."});
    }else{
        res.send(result)
    }
})

//buy coins
router.post('/buy', auth, async (req, res) => {
    try {
        let user = await User.findById(req.user._id,{name:1,sur_name:1,email:1,coins:1})
        const package = await Package.findOne({_id: req.body._id});    
        if (!package) {
            return res.status(404).send();
        }
        let sku = package.sku
        let token = req.body.googleKey

        console.log(token);
        let result = await validatePurchase(sku, token)

        if (!result) {
             return res.status(403).send({message:"Bu satınalma işlemi geçerli değil."});
        }
        
        let paymentPayload = {
            name: user.name,
            sur_name: "",
            email: user.email,
            before: user.coins,
            after: user.coins + package.value,
            sku: package.sku,
            value: package.value,
            price: package.price,
            user: req.user._id,
            package: package._id,
            createdAt: new Date()
        }

        let payment = new Payment(paymentPayload)
        await payment.save()
        user.coins = user.coins + package.value
        await user.save()
        res.send(package)
    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
})

module.exports = router;