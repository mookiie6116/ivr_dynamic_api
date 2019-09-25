const express = require("express");
const router = express.Router();
const ivr = require("../../models/connect_ivr");
const bodyParser = require("body-parser");
const jwt = require("../../models/jwt");
const moment = require('moment');

var urlencodedParser = bodyParser.urlencoded({
  extended: true
});

const alertSuccess = {
  title: 'Success',
  description: 'Save Success',
  variant: "success"
}
const alertError = {
  title: 'Error',
  description: 'Something Wrong',
  variant: "danger"
}

router.post("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let { service_id, service_action_id, service_action_value } = req.body
  let created_by = req.uuid;
  let created_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let promise = new Promise((resolve, reject) => {
    let sql = `SELECT * FROM service_routing WHERE service_id = '${service_id}' AND isDelete = '0'`
    ivr.query(sql, function (response) {
      if (response.length == 0) { resolve() }
      else {
        let uuid = req.uuid;
        let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
        let sql = ` UPDATE service_routing 
                    SET service_action_id = '${service_action_id}', 
                        service_action_value = '${service_action_value}', 
                        modified_by = '${uuid}', 
                        modified_dt = '${modified_dt}' 
                    WHERE service_id = '${service_id}'`
        ivr.query(sql, function (response) {
          if (response) res.status(200).json({ alert: alertError })
          res.status(200).json({ alert: alertSuccess })
        })
      }
    })
  }).then(function (json) {
    return new Promise((resolve, reject) => {
      let sql = `INSERT INTO service_routing (service_id, service_action_id, service_action_value, created_by, created_dt, modified_by, modified_dt) 
                  VALUES ('${service_id}', '${service_action_id}', '${service_action_value}', '${created_by}', '${created_dt}', '${created_by}', '${created_dt}')`
      ivr.query(sql, function (response) {
        if (response) res.status(200).json({ alert: alertError })
        res.status(201).json({ alert: alertSuccess })
      })
    })
  })
})

router.delete("/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let uuid = req.uuid;
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let sql = ` UPDATE service_routing 
              SET isDelete = '1', 
                  modified_by = '${uuid}', 
                  modified_dt = '${modified_dt}' 
              WHERE service_id = '${req.params.id}'`
  ivr.query(sql, function (response) {
    if (response) res.status(200).json({ alert: alertError })
    res.status(200).json({ alert: alertSuccess })
  })
})

router.get("/", jwt.verify, urlencodedParser, function (req, res, next) {
  // let sql = `SELECT * FROM service_routing`
  let sql = `SELECT 
                  sr.service_id, 
                  sr.service_action_id, 
                  a.action_name AS Action, 
                  sr.service_action_value ,
                  CASE
                    WHEN sr.service_action_id=1 THEN (SELECT voice_name FROM voice_config WHERE voice_id = sr.service_action_value)
                    WHEN sr.service_action_id=2 THEN (SELECT name FROM ivr_script WHERE ivr_id = sr.service_action_value)
                    ELSE sr.service_action_value
                  END as [Values]
              FROM service_routing sr
              LEFT JOIN [action] a ON sr.service_action_id = a.action_id
              WHERE isDelete = '0'`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.get("/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let id = req.params.id
  // let sql = `SELECT * FROM service_routing WHERE service_id = ${id}`
  let sql = `SELECT 
                  sr.service_id, 
                  sr.service_action_id, 
                  a.action_name AS Action, 
                  sr.service_action_value ,
                  CASE
                    WHEN sr.service_action_id=1 THEN (SELECT voice_name FROM voice_config WHERE voice_id = sr.service_action_value)
                    WHEN sr.service_action_id=2 THEN (SELECT name FROM ivr_script WHERE ivr_id = sr.service_action_value)
                    ELSE sr.service_action_value
                  END as [external] 
                FROM service_routing sr
                  LEFT JOIN [action] a ON sr.service_action_id = a.action_id
                WHERE service_id = ${id}`
  ivr.query(sql, function (response) {
    if (response.length) {
      res.status(200).json(response[0])
    } else {
      res.status(404).json("Not Found")
    }
  })
})

module.exports = router;