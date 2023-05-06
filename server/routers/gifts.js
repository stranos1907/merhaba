//gifts router
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Gift = require('../models/Gift/Gift');

//get all gifts
router.get('/list', auth, async (req, res) => {
    try {
        const gifts = await Gift.find({}).sort({index: 1})
        res.send(gifts);
    } catch (e) {
        res.status(500).send(e);
    }
})

//add new gift
router.post('/add', auth, async (req, res) => {
    const gift = new Gift({
        ...req.body
    })
    try {
        await gift.save();
        res.status(200).send(gift);
    } catch (e) {
        res.status(400).send(e);
    }
})

//update gift
router.put('/update', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["_id",'name', 'desc', 'value', 'price', 'image', 'index'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }
    try {
        const gift = await Gift.findOne({_id: req.body._id});
        if (!gift) {
            return res.status(404).send();
        }
        updates.forEach((update) => gift[update] = req.body[update]);
        await gift.save();
        res.send(gift);
    } catch (e) {
        res.status(400).send(e);
    }
})

module.exports = router;