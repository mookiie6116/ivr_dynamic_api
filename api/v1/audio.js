const express = require("express");
const router = express.Router();
const ivr = require("../../models/connect_ivr");
const bodyParser = require("body-parser");
const jwt = require("../../models/jwt");
const fs = require("fs")
const uuidv1 = require('uuid/v1');
const moment = require('moment');

var urlencodedParser = bodyParser.urlencoded({
  extended: true,
  limit: '10mb'
});
var multer = require('multer');
var upload = multer({
  dest: 'uploads/'
});

router.post("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let { voice_name, voice_description, audio } = req.body
  let voice_id = uuidv1()
  let created_by = req.uuid;
  let created_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let sql = `INSERT INTO voice_config (voice_id, voice_name, voice_description, voice_storage, created_dt, created_by)
            VALUES ('${voice_id}', '${voice_name}', '${voice_description}', '${audio}', '${created_dt}', '${created_by}')`
  ivr.query(sql, function (response) {
    res.status(201).json()
  })
})

router.post("/upload", jwt.verify, upload.single('audio'), function (req, res, next) {
  let file = req.file
  console.log(file);
  let uploadLocation = 'uploads/' + file.originalname // where to save the file to. make sure the incoming name has a .wav extension
  fs.writeFileSync(uploadLocation, Buffer.from(new Uint8Array(file.buffer)));// write the blob to the server as a file  
  fs.unlink('uploads/' + file.filename, function (err) {})
  res.status(200).json()
})
module.exports = router;