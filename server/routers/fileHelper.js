const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const fs = require('fs');
var pathx = require("path");
const config = require('../../config');
const adminAuth = require('../middleware/adminAuth');
const modAuth = require('../middleware/modAuth');

var host = "http://45.136.6.84:3300"
let dest = "..//images"
const allow = [
    "pp",
    "gift",
    "image",
    "slider",
    "audio"
]

router.post('/images/upload', async function(req, res) {
  let module = req.body.module
  if (!module) {
    console.log("Module not exixs");
      res.status(400).send({error:"Module Required"})
      return
  } 
  let urls = []    
  try {
      let path = dest + "/" + module
      let folderExist = fs.existsSync(path)

      if (folderExist) {
          for await (key of Object.keys(req.files)){
              var file = req.files[key];
              
              //random number 
              let random = randomString(10)
              let fileName = random + Date.now() + pathx.extname(file.name)
            
              let path = dest + "/" + module + "/" + fileName
              await file.mv(path, (error) => {
                if (error) {
                  res.status(400).send({ status: 'fail', error })
                }
              })
              urls.push({
               host,
               path:"/images/" + module + "/" + fileName,
               url:host+"/images/" + module + "/" + fileName
              })
          }
          res.writeHead(200, {
                 'Content-Type': 'application/json'
          })
        //  console.log(urls);
          res.end(JSON.stringify({ status: urls.length > 0 ? 'success':"fail", urls }))
      }else{
        console.log("Folder not exixs");
          res.status(400).send({ status: 'fail',message:"Güvenlik gereği sadece belirlenen modüller için dosya yükleyebilirsiniz.Lütfen geçerli bir modül girin.", allow })
      }
  } catch(e) {
      console.log(e);
      res.status(400).send({ status: 'fail',message:"Bir hata oluştu." })
  }
});

router.post('/admin/images/upload',modAuth, async function(req, res) {
  let module = req.body.module
  if (!module) {
    console.log("Module not exixs");
      res.status(400).send({error:"Module Required"})
      return
  } 
  let urls = []    
  try {
      let path = dest + "/" + module
      let folderExist = fs.existsSync(path)

      if (folderExist) {
          for await (key of Object.keys(req.files)){
              var file = req.files[key];
              let random = randomString(10)
              let fileName = random + Date.now() + pathx.extname(file.name)
              let path = dest + "/" + module + "/" + fileName
              await file.mv(path, (error) => {
                if (error) {
                  res.status(400).send({ status: 'fail', error })
                }
              })
              urls.push({
               host,
               path:"/images/" + module + "/" + fileName,
               url:host+"/images/" + module + "/" + fileName
              })
          }
          res.writeHead(200, {
                 'Content-Type': 'application/json'
          })
       //   console.log(urls);
          res.end(JSON.stringify({ status: urls.length > 0 ? 'success':"fail", urls }))
      }else{
        console.log("Folder not exixs");
          res.status(400).send({ status: 'fail',message:"Güvenlik gereği sadece belirlenen modüller için dosya yükleyebilirsiniz.Lütfen geçerli bir modül girin.", allow })
      }
  } catch(e) {
      console.log(e);
      res.status(400).send({ status: 'fail',message:"Bir hata oluştu." })
  }
});


router.post('/images/remove',modAuth, async function(req, res) {
  let file = req.body.file
  try {
      if (!file) {
          res.status(400).send({ status: 'fail',message:"Baba akü yok."})
          return
      }

      if (file.includes("../")) {
          res.status(400).send({ status: 'fail',message:"Ban ban ban. Hop ne yapıyon. '../' filan ayıp oluyor."})
          return
      }

      let path = dest + file
     // console.log(path);
      fs.unlink(path, (err) => {
          if (err) {
              console.log(err);
              res.status(400).send({ status: 'fail',message:"Bir hata oluştu.",err })
            return
          }
          res.status(200).send({ status: 'success',message:"Puff gitti." })
        })
  } catch(e) {
      console.log(e);
      res.status(400).send({ status: 'fail',message:"Bir hata oluştu.",err:e })
  }
});
 
router.get("/images/:directory/:file",async (req,res)=>{
  try {
    let path = dest + "/" + req.params.directory +"/"+ req.params.file
    
    let exist = fs.existsSync(path)
    if(exist){
      var fileStream = fs.createReadStream(path);
      fileStream.on('open', function () {
          fileStream.pipe(res);
    });
    }else{
      res.send({message:"No File."})
    }
  } catch (error) {
    console.log(error);
    res.send(error)
  }
  
})
router.get("/terms",async (req,res)=>{
  try {
    var StringDecoder = require('string_decoder').StringDecoder;
    fs.readFile('./terms.html', function (err, html) {
      if (err) {
          throw err; 
      }       
      var encoded = html.toString("utf-8");

      encoded = encoded.replaceAll("{{appName}}",config.APP_NAME)
      encoded = encoded.replaceAll("{{name}}",config.AUTHOR)

      encoded = encoded.replaceAll("{{email}}",config.EMAIL)
      res.writeHeader(200, {"Content-Type": "text/html charset=utf-8" });  
      res.write('<!DOCTYPE html><html> <head><meta charset="utf-8"></head><body>' +
      encoded +
  '</body></html>');  
      res.end();  
    });

  } catch (error) {
    console.log(error);
    res.send(error)
  }
})

let randomString = (length) => {
  var result           = '';
  var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}





module.exports = router;