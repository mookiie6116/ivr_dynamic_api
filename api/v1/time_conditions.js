const express = require("express");
const router = express.Router();
const ivr = require("../../models/connect_ivr");
const bodyParser = require("body-parser");
const jwt = require("../../models/jwt");
const uuidv1 = require('uuid/v1');
const moment = require('moment');
const helper = require('../helper/helper')

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

router.delete("/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let uuid = req.uuid;
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let sql = ` UPDATE time_conditions 
              SET isDelete = '1', 
                  modified_by = '${uuid}', 
                  modified_dt = '${modified_dt}' 
              WHERE time_id = '${req.params.id}'`
  ivr.query(sql, function (response) {
    if (response) {
      res.status(200).json({
        alert: helper.alertToast(`TIME CONDITIONS`, `Delete Time Conditions Error`, `danger`),
      })
    }
    else {
      res.status(200).json({
        alert: helper.alertToast(`TIME CONDITIONS`, `Delete Time Conditions Successfully`, `success`),
      })
    }
  })
})

router.get("/category", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT * FROM time_conditions_category WHERE isDelete = '0'`;
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.get("/category/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT  a.*, d.name as category,
              CONCAT(b.fname,' ',b.lname) AS name_created,
              CONCAT(c.fname,' ',c.lname) AS name_modified
            FROM time_conditions a
              LEFT JOIN users b ON a.created_by = b.uuid
              LEFT JOIN users c ON a.modified_by = c.uuid
              LEFT JOIN time_conditions_category d ON a.category_id = d.id
            WHERE a.isDelete = '0'`
  if (!req.params.id) {
    sql += ` ORDER BY d.name,a.time_condition_name ASC`
  } else {
    sql += ` AND a.category_id = '${req.params.id}'
            ORDER BY d.name,a.time_condition_name ASC`
  }
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.post("/category", jwt.verify, urlencodedParser, function (req, res, next) {
  let { id, name } = req.body
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  if (id) {
    let sql = `UPDATE time_conditions_category
                  SET name = '${name}',
                  modified_dt = '${modified_dt}'
                  WHERE id = '${id}'`
    ivr.query(sql, function (response) {
      if (response) {
        res.status(200).json({
          alert: helper.alertToast(`TIME CONDITIONS`, `Create Category Error`, `danger`),
        })
      }
      else {
        res.status(200).json({
          alert: helper.alertToast(`TIME CONDITIONS`, `Create Category Successfully`, `success`),
        })
      }

    })
  } else {
    helper.checkAILastId('time_conditions_category', 'id', function (params) {
      let sql = `INSERT INTO time_conditions_category (id,name,modified_dt) VALUES (${params},'${name}','${modified_dt}')`
      ivr.query(sql, function (response) {
        if (response) res.status(200).json({
          alert: helper.alertToast(`TIME CONDITIONS`, `Create Category Error`, `danger`),
        })
        res.status(200).json({
          alert: helper.alertToast(`TIME CONDITIONS`, `Create Category Successfully`, `success`),
        })
      })
    })
  }
})

router.delete("/category/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let sql = ` UPDATE time_conditions_category 
              SET isDelete = '1', 
                  modified_dt = '${modified_dt}' 
              WHERE id = '${req.params.id}'`
  ivr.query(sql, function (response) {
    if (response) {
      res.status(200).json({
        alert: helper.alertToast(`TIME CONDITIONS`, `Delete Time Conditions Category Error`, `danger`),
      })
    }
    else {
      res.status(200).json({
        alert: helper.alertToast(`TIME CONDITIONS`, `Delete Time Conditions Category Successfully`, `success`),
      })
    }
  })
})

router.get("/chkDel/:category_id", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql_chk = `SELECT count(time_id) AS count FROM time_conditions WHERE isDelete = '0' AND category_id = '${req.params.category_id}'`
  ivr.query(sql_chk, function (response) {
    res.status(200).json(response[0].count)
  })
})

router.post('/duplicate', jwt.verify, urlencodedParser, function (req, res, next) {
  let { id, name } = req.body;
  let created_by = req.uuid;
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let promise = new Promise((resolve, reject) => {
    let sql_chkName = `SELECT * FROM time_conditions_category WHERE name = '${name}' OR name like 'copy ${name}(%'`
    ivr.query(sql_chkName, function (response) {
      let category_name = `copy ${name}(${response.length})`
      helper.checkAILastId('time_conditions_category', 'id', function (params) {
        let sql = `INSERT INTO time_conditions_category (id,name,modified_dt) VALUES (${params},'${category_name}','${modified_dt}')`
        ivr.query(sql, function (response) {
          resolve(params)
        })
      })
    })
  }).then(json => {
    return new Promise((resolve, reject) => {
      let sql_item = `SELECT * FROM time_conditions WHERE category_id = '${id}' AND isDelete = '0'`
      ivr.query(sql_item, function (response) {
        for (let i = 0, p = Promise.resolve(); i <= response.length; i++) {
          p = p.then(_ => new Promise(res => {
            if (i < response.length) {
              const element = response[i];
              let time_id = uuidv1()
              let sql = `INSERT INTO time_conditions (time_id, time_condition_name, time_service_id, time_match_action_id, time_match_action_value,time_notmatch_action_id,time_notmatch_action_value,created_by, created_dt,modified_by,modified_dt,category_id) 
                        VALUES ('${time_id}', '${element.time_condition_name}', '${element.time_service_id}', '${element.time_match_action_id}', '${element.time_match_action_value}','${element.time_notmatch_action_id}','${element.time_notmatch_action_value}', '${created_by}', '${modified_dt}', '${created_by}', '${modified_dt}', '${json}')`
              ivr.query(sql, function (response) {
                if (response) {
                  reject(json)
                } else {
                  res(response)
                }
              })
            }
            else {
              resolve(json)
            }
          }))
        }
      })
    })
  }).then(json => {
    res.status(200).json({
      alert: helper.alertToast(`ANNOUCEMENTS`, `Copy Category Successfully`, `success`),
    })
  }).catch(json => {
    console.log(error);
  })
})

router.get("/chk", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT *
             FROM time_conditions
             WHERE time_condition_name = '${req.query.time_condition_name}'
                  AND category_id = '${req.query.category_id}'
                  AND isDelete = '0'
                  AND time_id NOT IN ('${req.query.time_id}')`
  ivr.query(sql, function (response) {
    res.status(200).json(response.length)
  })
})

router.get("/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let id = req.params.id
  let sql = `SELECT * ,
              CASE
                WHEN time_match_action_id=1 THEN ''
                WHEN time_match_action_id=2 THEN ''
                WHEN time_match_action_id=4 THEN ''
                WHEN time_match_action_id=6 THEN ''
                ELSE time_match_action_value
              END as [time_match_external] ,
              CASE
                WHEN time_notmatch_action_id=1 THEN ''
                WHEN time_notmatch_action_id=2 THEN ''
                WHEN time_notmatch_action_id=4 THEN ''
                WHEN time_notmatch_action_id=6 THEN ''
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

router.post("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let { time_id, time_condition_name, time_service_id, time_match_action_id, time_match_action_value, time_notmatch_action_id, time_notmatch_action_value, category_id } = req.body
  if (time_id) {
    let uuid = req.uuid;
    let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
    let sql = ` UPDATE time_conditions
                SET time_condition_name = '${time_condition_name}',
                    time_service_id = '${time_service_id}',
                    time_match_action_id = '${time_match_action_id}',
                    time_match_action_value = '${time_match_action_value}',
                    time_notmatch_action_id = '${time_notmatch_action_id}',
                    time_notmatch_action_value = '${time_notmatch_action_value}',
                    modified_by = '${uuid}',
                    modified_dt = '${modified_dt}'
                WHERE time_id = '${req.body.time_id}'`
    ivr.query(sql, function (response) {
      if (response) {
        res.status(200).json({
          alert: helper.alertToast(`TIME CONDITIONS`, `Update Time Conditions Error`, `danger`),
        })
      }
      else {
        res.status(200).json({
          alert: helper.alertToast(`TIME CONDITIONS`, `Update Time Conditions Successfully`, `success`),
        })
      }
    })
  } else {
    let time_id = uuidv1()
    let created_by = req.uuid;
    let created_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
    let sql = `INSERT INTO time_conditions (time_id, time_condition_name, time_service_id, time_match_action_id, time_match_action_value,time_notmatch_action_id,time_notmatch_action_value,created_by, created_dt,modified_by,modified_dt,category_id) 
              VALUES ('${time_id}', '${time_condition_name}', '${time_service_id}', '${time_match_action_id}', '${time_match_action_value}','${time_notmatch_action_id}','${time_notmatch_action_value}', '${created_by}', '${created_dt}', '${created_by}', '${created_dt}', '${category_id}')`
    ivr.query(sql, function (response) {
      if (response) {
        res.status(200).json({
          alert: helper.alertToast(`TIME CONDITIONS`, `Create Time Conditions Error`, `danger`),
        })
      }
      else {
        res.status(200).json({
          alert: helper.alertToast(`TIME CONDITIONS`, `Create Time Conditions Successfully`, `success`),
        })
      }
    })
  }
})

module.exports = router;