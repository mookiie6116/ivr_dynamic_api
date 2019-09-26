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
  let { annoucement_name, annoucement_desc, annoucement_voice_id, allow_key, allow_skip, action_id, action_value } = req.body
  let annoucement_id = uuidv1()
  let created_by = req.uuid;
  let created_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let promise = new Promise((resolve, reject) => {
    let sql = `SELECT * FROM annoucements WHERE annoucement_name = '${annoucement_name}' AND isDelete = '0'`
    ivr.query(sql, function (response) {
      if (response.length == 0) { resolve() }
      else {
        let uuid = req.uuid;
        let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
        let sql = ` UPDATE annoucements
                    SET annoucement_desc = '${annoucement_desc}',
                        annoucement_voice_id = '${annoucement_voice_id}',
                        allow_key = '${allow_key}',
                        allow_skip = '${allow_skip}',
                        action_id = '${action_id}',
                        action_value = '${action_value}',
                        modified_by = '${uuid}',
                        modified_dt = '${modified_dt}'
                    WHERE annoucement_id = '${req.body.annoucement_id}'`
        ivr.query(sql, function (response) {
          if (response) res.status(200).json({ alert: alertError })
          res.status(200).json({ alert: alertSuccess })
        })
      }
    })
  }).then(function (json) {
    return new Promise((resolve, reject) => {
      let sql = `INSERT INTO annoucements (annoucement_id,annoucement_name,annoucement_desc,annoucement_voice_id,allow_key,allow_skip,action_id,action_value,created_by,created_dt,modified_by,modified_dt) 
      VALUES ('${annoucement_id}', '${annoucement_name}', '${annoucement_desc}', '${annoucement_voice_id}', '${allow_key}', '${allow_skip}', '${action_id}', '${action_value}', '${created_by}', '${created_dt}','${created_by}', '${created_dt}')`
      ivr.query(sql, function (response) {
        if (response) res.status(200).json({ alert: alertError })
        res.status(201).json({ alert: alertSuccess })
      })
    })
  })
})

router.put("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let { annoucement_desc, annoucement_voice_id, allow_key, allow_skip, action_id, action_value } = req.body
  let uuid = req.uuid;
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let sql = ` UPDATE annoucements
              SET annoucement_desc = '${annoucement_desc}',
                  annoucement_voice_id = '${annoucement_voice_id}',
                  allow_key = '${allow_key}',
                  allow_skip = '${allow_skip}',
                  action_id = '${action_id}',
                  action_value = '${action_value}',
                  modified_by = '${uuid}',
                  modified_dt = '${modified_dt}'
              WHERE annoucement_id = '${annoucement_id}'`
  ivr.query(sql, function (response) {
    if (response) res.status(200).json({ alert: alertError })
    res.status(200).json({ alert: alertSuccess })
  })
})

router.get("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT a.*,
                CASE
                  WHEN LEN(a.annoucement_desc) > 20 THEN CONCAT(SUBSTRING(a.annoucement_desc, 0, 20),'...')
                  ELSE a.annoucement_desc
                END AS description_topic,
                CONCAT(b.fname,' ',b.lname) AS name_created,
                CONCAT(c.fname,' ',c.lname) AS name_modified
              FROM annoucements a
              LEFT JOIN users b ON a.created_by = b.uuid
              LEFT JOIN users c ON a.modified_by = c.uuid
              WHERE a.isDelete = '0'`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.get("/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let id = req.params.id
  let sql = `SELECT *,
              CASE
              WHEN action_id=1 THEN (SELECT voice_name FROM voice_config WHERE voice_id = action_value)
              WHEN action_id=2 THEN (SELECT name FROM ivr_script WHERE ivr_id = action_value)
              ELSE action_value
            END as [external] 
             FROM annoucements WHERE annoucement_id = '${id}'`
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
  let sql = ` UPDATE annoucements 
              SET isDelete = '1', 
                  modified_by = '${uuid}', 
                  modified_dt = '${modified_dt}' 
              WHERE annoucement_id = '${req.params.id}'`
  ivr.query(sql, function (response) {
    if (response) res.status(200).json({ alert: alertError })
    res.status(200).json({ alert: alertSuccess })
  })
})

module.exports = router;