const jwt = require('jsonwebtoken')
const User = require('../models/User/User')

//Config
const config = require("../../config");

const auth = async(req, res, next) => {
    try {
        const rawToken = req.header('Authorization')
        if (rawToken == null) {
            res.status(401).send({ message: 'Lütfen oturum açın.' })
            return
        }
        const token = rawToken.replace(config.AUTHORIZATION, '')        
        const data = jwt.verify(token, config.PRIVATE_KEY)
        User.findOne({ _id: data._id, 'tokens.token': token },{_id:1,name:1,sur_name:1,phone:1,banned:1,email:1,coins:1}).then(user =>{
                if (!user) {
                    res.status(401).send({ message: 'Oturum geçerli değil.' })
                    return
                }
                if (user.banned) {
                    res.status(403).send({ message: 'Hesabınız engellenmiştir.' })
                    return
                }
        
                req.user = user
                req.token = token
                next()
        })
    } catch (error) {
        console.log(error);
        res.status(401).send({ message: 'Bir hata oluştu.' })
    }
}
module.exports = auth
