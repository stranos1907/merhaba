//sliders router
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Slider = require('../models/Slider/Slider');
const VipSlider = require('../models/VipSlider/VipSlider');


//get all sliders
router.get('/list', async (req, res) => {
    try {
        const sliders = await Slider.find({}).sort({index: 1})
        res.send(sliders);
    } catch (e) {
        res.status(500).send(e);
    }
})

router.get('/vip-list', async (req, res) => {
    try {
        const sliders = await VipSlider.find({}).sort({index: 1})
        res.send(sliders);
    } catch (e) {
        res.status(500).send(e);
    }
})

//add new slider
router.post('/add', auth, async (req, res) => {
    const slider = new Slider({
        ...req.body
    })
    try {
        await slider.save();
        res.status(200).send({slider,body:req.body});
    } catch (e) {
        res.status(400).send(e);
    }
})


//update slider
router.put('/update', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["_id",'name', 'desc', 'value', 'price', 'image', 'index'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }
    try {
        const slider = await Slider.findOne({_id: req.body._id});
        if (!slider) {
            return res.status(404).send();
        }
        updates.forEach((update) => slider[update] = req.body[update]);
        await slider.save();
        res.send(slider);
    } catch (e) {
        res.status(400).send(e);
    }
})


module.exports = router;
