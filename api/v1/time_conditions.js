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
  let { time_condition_name, time_service_id, time_match_action_id, time_match_action_value, time_notmatch_action_id, time_notmatch_action_value } = req.body
  let time_id = uuidv1()
  let created_by = req.uuid;
  let created_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let promise = new Promise((resolve, reject) => {
    let sql = `SELECT * FROM time_conditions WHERE time_condition_name = '${time_condition_name}' AND isDelete = '0'`
    ivr.query(sql, function (response) {
      if (response.length == 0) { resolve() }
      else {
        let uuid = req.uuid;
        let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
        let sql = ` UPDATE time_conditions
                    SET time_service_id = '${time_service_id}',
                        time_match_action_id = '${time_match_action_id}',
                        time_match_action_value = '${time_match_action_value}',
                        time_notmatch_action_id = '${time_notmatch_action_id}',
                        time_notmatch_action_value = '${time_notmatch_action_value}',      
                        modified_by = '${uuid}',
                        modified_dt = '${modified_dt}'
                    WHERE time_id = '${req.body.time_id}'`
        ivr.query(sql, function (response) {
          if (response) res.status(400).json({ alert: alertError })
          res.status(200).json({ alert: alertSuccess })
        })
      }
    })
  }).then(function (json) {
    return new Promise((resolve, reject) => {
      let sql = `INSERT INTO time_conditions (time_id, time_condition_name, time_service_id, time_match_action_id, time_match_action_value,time_notmatch_action_id,time_notmatch_action_value,created_by, created_dt,modified_by,modified_dt) 
      VALUES ('${time_id}', '${time_condition_name}', '${time_service_id}', '${time_match_action_id}', '${time_match_action_value}','${time_notmatch_action_id}','${time_notmatch_action_value}', '${created_by}', '${created_dt}', '${created_by}', '${created_dt}')`
      ivr.query(sql, function (response) {
        if (response) res.status(400).json({ alert: alertError })
        res.status(200).json({ alert: alertSuccess })
      })
    })
  })
})

router.put("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let { time_id, time_service_id, time_match_action_id, time_match_action_value, time_notmatch_action_id, time_notmatch_action_value } = req.body
  let uuid = req.uuid;
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let sql = ` UPDATE time_conditions
              SET time_service_id = '${time_service_id}',
                  time_match_action_id = '${time_match_action_id}',
                  time_match_action_value = '${time_match_action_value}',
                  time_notmatch_action_id = '${time_notmatch_action_id}',
                  time_notmatch_action_value = '${time_notmatch_action_value}',
                  modified_by = '${uuid}',
                  modified_dt = '${modified_dt}'
              WHERE time_id = '${time_id}'`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.get("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT  a.*,
              CONCAT(b.fname,' ',b.lname) AS name_created,
              CONCAT(c.fname,' ',c.lname) AS name_modified
             FROM time_conditions a
              LEFT JOIN users b ON a.created_by = b.uuid
              LEFT JOIN users c ON a.modified_by = c.uuid
             WHERE isDelete = '0'`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.get("/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let id = req.params.id
  let sql = `SELECT * ,
              CASE
                WHEN time_match_action_id=1 THEN (SELECT voice_name FROM voice_config WHERE voice_id = time_match_action_value)
                WHEN time_match_action_id=2 THEN (SELECT name FROM ivr_script WHERE ivr_id = time_match_action_value)
                ELSE time_match_action_value
              END as [time_match_external] ,
              CASE
                WHEN time_notmatch_action_id=1 THEN (SELECT voice_name FROM voice_config WHERE voice_id = time_notmatch_action_value)
                WHEN time_notmatch_action_id=2 THEN (SELECT name FROM ivr_script WHERE ivr_id = time_notmatch_action_value)
                ELSE time_notmatch_action_value
              END as [time_notmatch_external] 
              FROM time_conditions WHERE time_id = '${id}'`
  ivr.query(sql, function (response) {
    if (response.length) {
      res.status(200).json(response[0])
    } else {
      res.status(404).json("Not Found")
    }
  })
})

router.delete("/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let uuid = req.uuid;
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let sql = ` UPDATE time_conditions 
              SET isDelete = '1', 
                  modified_by = '${uuid}', 
                  modified_dt = '${modified_dt}' 
              WHERE time_id = '${req.params.id}'`
  ivr.query(sql, function (response) {
    if (response) res.status(200).json({ alert: alertError })
    res.status(200).json({ alert: alertSuccess })
  })
})

module.exports = router;