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
  let { name, description, voice_id, timeout, invalid_retries, invalid_retries_voice_id, invalid_voice_id, invalid_action_id, invalid_action_value, timeout_retries, timeout_retries_voice_id, timeout_voice_id, timeout_action_id, timeout_action_value, keyDetail } = req.body
  let created_by = req.uuid;
  let created_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let promise = new Promise((resolve, reject) => {
    let sql = `SELECT * FROM ivr_script WHERE name = '${name}'`
    ivr.query(sql, function (response) {
      if (response.length == 0) { resolve() }
      else { res.status(400).json('Duplicate service_id') }
    })
  }).then(function (json) {
    return new Promise((resolve, reject) => {
      let ivr_id = uuidv1()
      let sql = `INSERT INTO ivr_script (ivr_id, name, description, voice_id, timeout, invalid_retries, invalid_retries_voice_id, invalid_voice_id, invalid_action_id, invalid_action_value, timeout_retries, timeout_retries_voice_id, timeout_voice_id, timeout_action_id, timeout_action_value, created_by, created_dt) 
      VALUES ('${ivr_id}', '${name}', '${description}', '${voice_id}', '${timeout}', '${invalid_retries}', '${invalid_retries_voice_id}', '${invalid_voice_id}', '${invalid_action_id}', '${invalid_action_value}', '${timeout_retries}', '${timeout_retries_voice_id}', '${timeout_voice_id}', '${timeout_action_id}', '${timeout_action_value}', '${created_by}', '${created_dt}')`
      ivr.query(sql, function (response) {
        resolve(ivr_id)
      })
    })
  }).then(function (json) {
    return new Promise((resolve, reject) => {
      for (let i = 0, p = Promise.resolve(); i <= keyDetail.length; i++) {
        p = p.then(_ => new Promise(res => {
          if (i < keyDetail.length) {
            const element = keyDetail[i];
            let sql_keyDetail = `INSERT INTO ivr_script_key_detail (ivr_id, key_press, key_action_id, key_action_value)
                                    VALUES ('${json}','${element.key_press}', '${element.key_action_id}', '${element.key_action_value}');`
            db.query(sql_keyDetail, function (response) {
              res(response)
            })
          }
          else {
            resolve(json)
          }
        }))
      }
    })
  }).then(function (json) {
    res.status(201).json()
  })
})

router.put("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let { ivr_id, description, voice_id, timeout, invalid_retries, invalid_retries_voice_id, invalid_voice_id, invalid_action_id, invalid_action_value, timeout_retries, timeout_retries_voice_id, timeout_voice_id, timeout_action_id, timeout_action_value } = req.body
  let uuid = req.uuid;
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let promise = new Promise((resolve, reject) => {
    let sql = ` UPDATE ivr_script 
              SET description = '${description}',
                  voice_id = '${voice_id}',
                  timeout = '${timeout}',
                  invalid_retries = '${invalid_retries}',
                  invalid_retries_voice_id = '${invalid_retries_voice_id}',
                  invalid_voice_id = '${invalid_voice_id}',
                  invalid_action_id = '${invalid_action_id}',
                  invalid_action_value = '${invalid_action_value}',
                  timeout_retries = '${timeout_retries}',
                  timeout_retries_voice_id = '${timeout_retries_voice_id}',
                  timeout_voice_id = '${timeout_voice_id}',
                  timeout_action_id = '${timeout_action_id}',
                  timeout_action_value = '${timeout_action_value}',
                  modified_by = '${uuid}', 
                  modified_dt = '${modified_dt}' 
              WHERE ivr_id = '${ivr_id}'`
    ivr.query(sql, function (response) {
      resolve(ivr_id)
    })
  }).then(function (json) {
    return new Promise((resolve, reject) => {
      let sql_deletekeyDetail = `DELETE FROM ivr_script_key_detail WHERE ivr_id ='${json}';`
      db.query(sql_deletekeyDetail, function (response) {
        res(response)
      })
    })
  }).then(function (json) {
    return new Promise((resolve, reject) => {
      for (let i = 0, p = Promise.resolve(); i <= keyDetail.length; i++) {
        p = p.then(_ => new Promise(res => {
          if (i < keyDetail.length) {
            const element = keyDetail[i];
            let sql_keyDetail = `INSERT INTO ivr_script_key_detail (ivr_id, key_press, key_action_id, key_action_value)
                                  VALUES ('${json}','${element.key_press}', '${element.key_action_id}', '${element.key_action_value}');`
            db.query(sql_keyDetail, function (response) {
              res(response)
            })
          }
          else {
            resolve(json)
          }
        }))
      }
    })
  }).then(function (json) {
    res.status(201).json()
  })
})

router.get("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT * FROM ivr_script`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.get("/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let id = req.params.id
  let dataset = {}
  let promise = new Promise((resolve, reject) => {
    let sql = `SELECT * FROM ivr_script WHERE ivr_id = ${id}`
    ivr.query(sql, function (response) {
      if (response.length > 0) {
        dataset = response
        resolve(dataset)
      } else { res.status(200).json('Data Not Found') }
    })
  }).then(function (json) {
    let sql_keyDetail = `SELECT * FROM ivr_script_key_detail WHERE ivr_id = ${id}`
    db.query(sql_keyDetail, function (response) {
      json.keyDetail = response
      res.status(200).json(json)
    })
  })
})
module.exports = router;