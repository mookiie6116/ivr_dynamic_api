const express = require("express");
const router = express.Router();
const ivr = require("../../models/connect_ivr");
const bodyParser = require("body-parser");
const jwt = require("../../models/jwt");
const uuidv1 = require('uuid/v1');
const moment = require('moment');

var urlencodedParser = bodyParser.urlencoded({
  extended: true
});

router.post("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let { annoucement_name, annoucement_desc, annoucement_voice_id, repeat_key, allow_skip, action_id, action_value, created_by, created_dt } = req.body
  let annoucement_id = uuidv1()
  let created_by = req.uuid;
  let created_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let promise = new Promise((resolve, reject) => {
    let sql = `SELECT * FROM annoucements WHERE annoucement_name = '${annoucement_name}'`
    ivr.query(sql, function (response) {
      if (response.length == 0) { resolve() }
      else { res.status(400).json('Duplicate annoucement_name') }
    })
  }).then(function (json) {
    return new Promise((resolve, reject) => {
      let sql = `INSERT INTO annoucements (annoucement_id,annoucement_name,annoucement_desc,annoucement_voice_id,repeat_key,allow_skip,action_id,action_value,created_by,created_dt) 
      VALUES ('${annoucement_id}', '${annoucement_name}', '${annoucement_desc}', '${annoucement_voice_id}', '${repeat_key}', '${allow_skip}', '${action_id}', '${action_value}', '${created_by}', '${created_dt}')`
      ivr.query(sql, function (response) {
        res.status(201).json(response)
      })
    })
  })
})

router.put("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let { annoucement_desc, annoucement_voice_id, repeat_key, allow_skip, action_id, action_value } = req.body
  let uuid = req.uuid;
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let sql = ` UPDATE service_routing
              SET annoucement_desc = '${annoucement_desc}',
                  annoucement_voice_id = '${annoucement_voice_id}',
                  repeat_key = '${repeat_key}',
                  allow_skip = '${allow_skip}',
                  action_id = '${action_id}',
                  action_value = '${action_value}',
                  modified_by = '${uuid}',
                  modified_dt = '${modified_dt}'
              WHERE annoucement_id = '${annoucement_id}'`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.get("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELTCT * FROM annoucements`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.get("/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let id = req.params.id
  let sql = `SELTCT * FROM annoucements WHERE annoucement_id = ${id}`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})


module.exports = router;