const express = require("express");
const router = express.Router();
const ivr = require("../../models/connect_ivr");
const bodyParser = require("body-parser");
const jwt = require("../../models/jwt");
const moment = require('moment');

var urlencodedParser = bodyParser.urlencoded({
  extended: true
});

router.post("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let { service_id, service_action_id, service_action_value } = req.body
  let created_by = req.uuid;
  let created_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let promise = new Promise((resolve, reject) => {
    let sql = `SELECT * FROM service_routing WHERE service_id = '${service_id}'`
    ivr.query(sql, function (response) {
      if (response.length == 0) { resolve() }
      else { res.status(400).json('Duplicate service_id') }
    })
  }).then(function (json) {
    return new Promise((resolve, reject) => {
      let sql = `INSERT INTO service_routing (service_id, service_action_id, service_action_value, created_by, created_dt) 
                  VALUES ('${service_id}', '${service_action_id}', '${service_action_value}', '${created_by}', '${created_dt}')`
      ivr.query(sql, function (response) {
        res.status(201).json(response)
      })
    })
  })
})

router.put("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let { service_id, service_action_id, service_action_value } = req.body
  let uuid = req.uuid;
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let sql = ` UPDATE service_routing 
              SET service_action_id = '${service_action_id}', 
                  service_action_value = '${service_action_value}', 
                  modified_by = '${uuid}', 
                  modified_dt = '${modified_dt}' 
              WHERE service_id = '${service_id}'`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.get("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELTCT * FROM service_routing`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.get("/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let id = req.params.id
  let sql = `SELTCT * FROM service_routing WHERE service_id = ${id}`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

module.exports = router;