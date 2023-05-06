var otpGenerator = require('otp-generator')
const bcrypt = require('bcryptjs')
var request = require('request');

const vatan_base_url = "http://panel.vatansms.com/panel/smsgonder1N.php"
const vatan_userno = "33159"
const vatan_username = "05326662152"
const vatan_password = "RL4CUWX6"
const vatan_from = "08505913125"
const vatan_type = "Otp"

const OTP_MSG = "Flört Chat için giriş şifreniz "


function sendOtp(phone,callback) {
    let code = generateOtpCode()
    const requestUrl = vatan_base_url
    let query = {
        kno: vatan_userno,
        kul_ad:vatan_username,
        gonderen:vatan_from,
        sifre:vatan_password,
        numaralar:phone,
        tur:vatan_type,
        mesaj:OTP_MSG + code
    }

    //console.log("Sms Query: ", query);
    let url =  encodeURI(requestUrl)
    request({
        url:url,
        qs: query
    }, function (err, response, body) {
        if(err){
            console.log("Sms Error", err)
            callback({status:"fail",message:"Sms gönderimi başarısız."})
            return
        }
        //console.log("Sms Response: ", body)
        callback({status:"ok",message:"Sms gönderildi.",code:code})
    })
}


function generateOtpCode() {
    let code = otpGenerator.generate(4, { alphabets: false, upperCase: false, specialChars: false });
    return code;
  }

module.exports = {sendOtp}