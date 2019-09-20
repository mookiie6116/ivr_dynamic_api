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
  let { time_condition_name, time_service_id, time_match_action_id, time_match_action_value } = req.body
  let time_id = uuidv1()
  let created_by = req.uuid;
  let created_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let promise = new Promise((resolve, reject) => {
    let sql = `SELECT * FROM time_conditions WHERE time_condition_name = '${time_condition_name}'`
    ivr.query(sql, function (response) {
      if (response.length == 0) { resolve() }
      else { res.status(400).json('Duplicate time_condition_name') }
    })
  }).then(function (json) {
    return new Promise((resolve, reject) => {
      let sql = `INSERT INTO time_conditions (time_id, time_condition_name, time_service_id, time_match_action_id, time_match_action_value, created_by, created_dt) 
      VALUES ('${time_id}', '${time_condition_name}', '${time_service_id}', '${time_match_action_id}', '${time_match_action_value}', '${created_by}', '${created_dt}')`
      ivr.query(sql, function (response) {
        res.status(201).json(response)
      })
    })
  })
})

router.put("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let { time_id, time_service_id, time_match_action_id, time_match_action_value } = req.body
  let uuid = req.uuid;
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let sql = ` UPDATE time_conditions
              SET time_service_id = '${time_service_id}',
                  time_match_action_id = '${time_match_action_id}',
                  time_match_action_value = '${time_match_action_value}',
                  modified_by = '${uuid}',
                  modified_dt = '${modified_dt}'
              WHERE time_id = '${time_id}'`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.get("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELTCT * FROM time_conditions`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.get("/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let id = req.params.id
  let sql = `SELTCT * FROM time_conditions WHERE time_id = ${id}`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})


module.exports = router;