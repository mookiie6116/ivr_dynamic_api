const express = require("express");
const router = express.Router();
const ivr = require("../../models/connect_ivr");
const ftp = require("../../models/connect_sftp");
const bodyParser = require("body-parser");
const jwt = require("../../models/jwt");
const path = require('path');
const fs = require('fs-extra');
const uuidv1 = require('uuid/v1');
const moment = require('moment');
const formidable = require('formidable');
const helper = require('../helper/helper')

var urlencodedParser = bodyParser.urlencoded({
  extended: true,
  limit: '10mb'
});

router.post("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let { voice_name, audioName, voice_description, audio } = req.body
  let voice_id = uuidv1()
  let created_by = req.uuid;
  let created_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let sql = `INSERT INTO voice_config (voice_id, voice_name, voice_description, voice_filename, voice_storage, created_dt, created_by)
            VALUES ('${voice_id}', '${voice_name}', '${voice_description == undefined ? "" : voice_description}','${audioName}', '${audio}', '${created_dt}', '${created_by}')`
  ivr.query(sql, function (response) {
    if (response) res.status(200).json({
      alert: helper.alertToast(`VOICE`, `Upload Voice Error`,`danger`),
    })
    res.status(200).json({
      alert: helper.alertToast(`VOICE`, `Upload Voice Successfully`, `success`),
      voice_id: voice_id
    })
  })
})

router.post("/upload/:id", jwt.verify, function (req, res, next) {
  var id = req.params.id;
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    var audio = files.audio
    var oldpath = audio.path;
    var newfile = `${id}.${audio.name.split(".")[1]}`;
    var newpath = path.resolve("uploads") + "/" + newfile;
    fs.move(oldpath, newpath, function (err) {
      if (err) { }
      ftp.upload(newpath, audio.name)
      res.status(204).send()
    });
  })
})

router.get("/", jwt.verify, function (req, res, next) {
  let sql = `SELECT a.*,
                CONCAT(b.fname,' ',b.lname) AS name_created
              FROM voice_config a
                LEFT JOIN users b ON a.created_by = b.uuid`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})
module.exports = router;