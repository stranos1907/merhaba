//hobbies router 
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Hobby = require('../models/Hobby/Hobby');

//get all hobbies
router.get('/list', auth, async (req, res) => {
    try {
        const hobbies = await Hobby.find({}).sort({index: 1})
        res.send(hobbies);
    } catch (e) {
        res.status(500).send(e);
    }
})

//add new hobby
router.post('/add', auth, async (req, res) => {
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

//update hobby
router.put('/update', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["_id",'name', 'desc', 'value', 'price', 'image', 'index'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }
    try {
        const hobby = await Hobby.findOne({_id: req.body._id});
        if (!hobby) {
            return res.status(404).send();
        }
        updates.forEach((update) => hobby[update] = req.body[update]);
        await hobby.save();
        res.send(hobby);
    } catch (e) {
        res.status(400).send(e);
    }
})

module.exports = router;