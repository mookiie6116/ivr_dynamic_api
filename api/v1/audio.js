const express = require("express");
const router = express.Router();
const ivr = require("../../models/connect_ivr");
const bodyParser = require("body-parser");
const jwt = require("../../models/jwt");
const fs = require("fs")
const uuidv1 = require('uuid/v1');
const moment = require('moment');

var urlencodedParser = bodyParser.urlencoded({
  extended: true
});
// var multer = require('multer');
// var upload = multer({dest:'uploads/'});

router.post("/", jwt.verify,urlencodedParser, function (req, res, next){
  let { voice_name, voice_description, audio } = req.body
  console.log(audio);

  // let voice_id = uuidv1()
  // let created_by = req.uuid;
  // let created_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  // fs.readFile(audio,function(err, data){
  //   console.log(data);
  // })
  // fs.writeFile("uploads", audio, function (err) {

  // })
  // var voice_storage = new Buffer(voice_storage).toString('utf8');
  // let sql = `INSERT INTO voice_config (voice_id, voice_name, voice_description, voice_storage, created_dt, created_by)
  //           VALUES ('${voice_id}', '${voice_name}', '${voice_description}', '${voice_storage}', '${created_dt}', '${created_by}')`
  // ivr.query(sql,function (response) {
    // res.status(200).json("hello")
  // })
})

module.exports = router;