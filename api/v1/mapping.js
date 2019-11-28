const express = require("express");
const router = express.Router();
const ivr = require("../../models/connect_ivr");
const bodyParser = require("body-parser");
const jwt = require("../../models/jwt");
const moment = require('moment');
const helper = require('../helper/helper')

var urlencodedParser = bodyParser.urlencoded({
  extended: true
});

router.get("/category", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT * FROM service_routing_category WHERE isDelete = '0' ORDER BY name ASC`;
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.get("/category/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT
                  sr.no,
                  sr.service_id,
                  sr.service_action_id,
                  a.action_name AS Action,
                  sr.service_action_value ,
                  CASE
                    WHEN sr.service_action_id=1 THEN (SELECT annoucement_name FROM annoucements WHERE annoucement_id = sr.service_action_value)
                    WHEN sr.service_action_id=2 THEN (SELECT name FROM ivr_script WHERE ivr_id = sr.service_action_value)
                    WHEN sr.service_action_id=6 THEN (SELECT time_condition_name FROM time_conditions WHERE time_id = sr.service_action_value)
                    ELSE sr.service_action_value
                  END as [Values]
              FROM service_routing sr
              LEFT JOIN [action] a ON sr.service_action_id = a.action_id
              WHERE isDelete = '0' AND category_id = '${req.params.id}'`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.post("/category", jwt.verify, urlencodedParser, function (req, res, next) {
  let { id, name } = req.body
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  if (id) {
    let sql = `UPDATE service_routing_category
                  SET name = '${name}',
                  modified_dt = '${modified_dt}'
                  WHERE id = '${id}'`
    ivr.query(sql, function (response) {
      if (response) {
        res.status(200).json({
          alert: helper.alertToast(`SERVICE`, `Create Category Error`, `danger`),
        })
      }
      else {
        res.status(200).json({
          alert: helper.alertToast(`SERVICE`, `Create Category Successfully`, `success`),
        })
      }

    })
  } else {
    helper.checkAILastId('service_routing_category', 'id', function (params) {
    let sql = `INSERT INTO service_routing_category (id,name,modified_dt) VALUES ('${params}','${name}','${modified_dt}')`
    ivr.query(sql, function (response) {
      if (response) res.status(200).json({
        alert: helper.alertToast(`SERVICE`, `Create Category Error`, `danger`),
      })
      res.status(200).json({
        alert: helper.alertToast(`SERVICE`, `Create Category Successfully`, `success`),
      })
    })
  })
  }
})

router.delete("/category/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let sql = ` UPDATE service_routing_category 
              SET isDelete = '1', 
                  modified_dt = '${modified_dt}' 
              WHERE id = '${req.params.id}'`
  ivr.query(sql, function (response) {
    if (response) {
      res.status(200).json({
        alert: helper.alertToast(`SERVICE`, `Delete Service Category Error`, `danger`),
      })
    }
    else {
      res.status(200).json({
        alert: helper.alertToast(`SERVICE`, `Delete Service Category Successfully`, `success`),
      })
    }
  })
})

router.get("/chkDel/:category_id", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql_chk = `SELECT count(no) AS count FROM service_routing WHERE isDelete = '0' AND category_id = '${req.params.category_id}'`
  ivr.query(sql_chk, function (response) {
    res.status(200).json(response[0].count)
  })
})

router.get("/chk", jwt.verify, urlencodedParser,function (req, res, next) {
  let sql = `SELECT * FROM service_routing WHERE service_id = '${req.query.service_id}' AND isDelete = '0'`
  ivr.query(sql, function (response) {
    res.status(200).json(response.length)
  })
})

router.get("/chk-category", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT * 
             FROM service_routing_category 
             WHERE name = '${req.query.name}' 
              AND id NOT IN ('${req.query.id}')
              AND isDelete = '0'`
  ivr.query(sql, function (response) {
    res.status(200).json(response.length)
  })
})

router.delete("/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let uuid = req.uuid;
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let sql = ` UPDATE service_routing 
              SET isDelete = '1', 
                  modified_by = '${uuid}', 
                  modified_dt = '${modified_dt}' 
              WHERE no = '${req.params.id}'`
  ivr.query(sql, function (response) {
    if (response) {
      res.status(200).json({
        alert: helper.alertToast(`SERVICE`, `Delete Service Error`,`danger`),
      })
    }
    else {
      res.status(200).json({
        alert: helper.alertToast(`SERVICE`, `Delete Service Successfully`, `success`),
      })
    }
  })
})

router.get("/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let id = req.params.id
  let sql = `SELECT 
                  sr.no,
                  sr.service_id as service, 
                  sr.service_action_id, 
                  a.action_name AS Action, 
                  sr.service_action_value ,
                  CASE
                    WHEN sr.service_action_id=1 THEN ''
                    WHEN sr.service_action_id=2 THEN ''
                    WHEN sr.service_action_id=4 THEN ''
                    WHEN sr.service_action_id=6 THEN ''
                    ELSE sr.service_action_value
                  END as [external] 
                FROM service_routing sr
                  LEFT JOIN [action] a ON sr.service_action_id = a.action_id
                WHERE no = ${id}`
  ivr.query(sql, function (response) {
    if (response.length) {
      res.status(200).json(response[0])
    } else {
      res.status(404).json("Not Found")
    }
  })
})

router.post("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let { no, service, service_action_id, service_action_value,category_id } = req.body
  let service_id = service.id
  let service_name = service.name
  let created_by = req.uuid;
  let created_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let promise = new Promise((resolve, reject) => {
    let sql = `SELECT * FROM service_routing WHERE service_id = '${service.id}' AND isDelete = '0'`
    ivr.query(sql, function (response) {
      if (response.length == 0) { resolve() }
      else {
        let uuid = req.uuid;
        let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
        let sql = ` UPDATE service_routing 
                    SET service_name = '${service_name}',
                        service_action_id = '${service_action_id}', 
                        service_action_value = '${service_action_value}', 
                        modified_by = '${uuid}', 
                        modified_dt = '${modified_dt}',
                        category_id = '${category_id}' 
                    WHERE no = '${no}'`
        ivr.query(sql, function (response) {
          if (response) {
            res.status(200).json({
              alert: helper.alertToast(`SERVICE`, `Update Service Error`,`danger`),
            })
          }
          else {
            res.status(200).json({
              alert: helper.alertToast(`SERVICE`, `Update Service Successfully`, `success`),
            })
          }
        })
      }
    })
  }).then(function (json) {
    return new Promise((resolve, reject) => {
      let sql = `INSERT INTO service_routing (service_id, service_name, service_action_id, service_action_value, created_by, created_dt, modified_by, modified_dt, category_id) 
                  VALUES ('${service_id}', '${service_name}', '${service_action_id}', '${service_action_value}', '${created_by}', '${created_dt}', '${created_by}', '${created_dt}', '${category_id}')`
      ivr.query(sql, function (response) {
        if (response) {
          res.status(200).json({
            alert: helper.alertToast(`SERVICE`, `Create Service Error`,`danger`),
          })
        }
        else {
          res.status(200).json({
            alert: helper.alertToast(`SERVICE`, `Create Service Successfully`, `success`),
          })
        }
      })
    })
  })
})

module.exports = router;