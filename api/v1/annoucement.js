const express = require("express");
const router = express.Router();
const ivr = require("../../models/connect_ivr");
const bodyParser = require("body-parser");
const jwt = require("../../models/jwt");
const uuidv1 = require('uuid/v1');
const moment = require('moment');
const helper = require("../helper/helper")

var urlencodedParser = bodyParser.urlencoded({
  extended: true
});

router.get("/category", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT * FROM annoucements_category WHERE isDelete = '0' ORDER BY name ASC`;
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.get("/category/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT a.*,
                    d.action_name AS Action,
                    e.name as category,
                    CASE
                      WHEN a.action_id=1 THEN (SELECT annoucement_name FROM annoucements WHERE annoucement_id = a.action_value)
                      WHEN a.action_id=2 THEN (SELECT name FROM ivr_script WHERE ivr_id = a.action_value)
                      WHEN a.action_id=6 THEN (SELECT time_condition_name FROM time_conditions WHERE time_id = a.action_value)
                      ELSE a.action_value
                    END as [Values],
                    CASE
                      WHEN LEN(a.annoucement_desc) > 20 THEN CONCAT(SUBSTRING(a.annoucement_desc, 0, 20),'...')
                      ELSE a.annoucement_desc
                    END AS description_topic,
                    CONCAT(b.fname,' ',b.lname) AS name_created,
                    CONCAT(c.fname,' ',c.lname) AS name_modified
              FROM annoucements a
                    LEFT JOIN users b ON a.created_by = b.uuid
                    LEFT JOIN users c ON a.modified_by = c.uuid
                    LEFT JOIN [action] d ON a.action_id = d.action_id
                    LEFT JOIN annoucements_category e ON a.category_id = e.id
              WHERE a.isDelete = '0'`
  if (req.params.id == 0) {
    sql += ` ORDER BY e.name,a.annoucement_name ASC`
  } else {
    sql += ` AND a.category_id = '${req.params.id}'
            ORDER BY e.name,a.annoucement_name ASC`
  }
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.post("/category", jwt.verify, urlencodedParser, function (req, res, next) {
  let { id, name } = req.body
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  if (id) {
    let sql = `UPDATE annoucements_category
                  SET name = '${name}',
                  modified_dt = '${modified_dt}'
                  WHERE id = '${id}'`
    ivr.query(sql, function (response) {
      if (response) {
        res.status(200).json({
          alert: helper.alertToast(`ANNOUCEMENTS`, `Create Category Error`, `danger`),
        })
      }
      else {
        res.status(200).json({
          alert: helper.alertToast(`ANNOUCEMENTS`, `Create Category Successfully`, `success`),
        })
      }

    })
  } else {
    helper.checkAILastId('annoucements_category', 'id', function (params) {
      let sql = `INSERT INTO annoucements_category (id,name,modified_dt) VALUES (${params},'${name}','${modified_dt}')`
      ivr.query(sql, function (response) {
        if (response) res.status(200).json({
          alert: helper.alertToast(`ANNOUCEMENTS`, `Create Category Error`, `danger`),
        })
        res.status(200).json({
          alert: helper.alertToast(`ANNOUCEMENTS`, `Create Category Successfully`, `success`),
        })
      })
    })
  }
})

router.delete("/category/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let uuid = req.uuid;
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  return new Promise((resolve, reject) => {
    let sql = ` UPDATE annoucements_category 
                SET isDelete = '1', 
                    modified_dt = '${modified_dt}' 
                WHERE id = '${req.params.id}'`
    ivr.query(sql, function (response) {
      if (response) {
        reject()
      }
      else {
        resolve()
      }
    })
  }).then(json => {
    let sql_chk = `SELECT annoucement_id as id FROM annoucements WHERE isDelete = '0' AND category_id = '${req.params.id}'`
    ivr.query(sql_chk, function (response) {
      for (let i = 0, p = Promise.resolve(); i <= response.length; i++) {
        p = p.then(_ => new Promise(res => {
          if (i < response.length) {
            let element = response[i]
            let sql = ` UPDATE annoucements 
                        SET isDelete = '1', 
                            modified_by = '${uuid}', 
                            modified_dt = '${modified_dt}' 
                        WHERE annoucement_id = '${element.id}'`
            ivr.query(sql, function (response) {
              if (response) { reject() }
              else { res() }
            })
          }
          else {
            resolve()
          }
        }))
      }//end loop
    })
  }).then(json => {
    res.status(200).json({
      alert: helper.alertToast(`ANNOUCEMENTS`, `Delete Annoucements Category Successfully`, `success`),
    })
  }).catch(json => {
    res.status(200).json({
      alert: helper.alertToast(`ANNOUCEMENTS`, `Delete Annoucements Category Error`, `danger`),
    })
  })
})

// router.delete("/category/:id", jwt.verify, urlencodedParser, function (req, res, next) {
//   let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
//   let sql = ` UPDATE annoucements_category 
//               SET isDelete = '1', 
//                   modified_dt = '${modified_dt}' 
//               WHERE id = '${req.params.id}'`
//   ivr.query(sql, function (response) {
//     if (response) {
//       res.status(200).json({
//         alert: helper.alertToast(`ANNOUCEMENTS`, `Delete Annoucements Category Error`, `danger`),
//       })
//     }
//     else {
//       res.status(200).json({
//         alert: helper.alertToast(`ANNOUCEMENTS`, `Delete Annoucements Category Successfully`, `success`),
//       })
//     }
//   })
// })

router.get("/chkDel/:category_id", jwt.verify, urlencodedParser, function (req, res, next) {
  return new Promise((resolve, reject) => {
    let sql_chk = `SELECT annoucement_id as id FROM annoucements WHERE isDelete = '0' AND category_id = '${req.params.category_id}'`
    ivr.query(sql_chk, function (response) {
      for (let i = 0, p = Promise.resolve(); i <= response.length; i++) {
        p = p.then(_ => new Promise(res => {
          if (i < response.length) {
            helper.checkUsedObj(response[i].id, function (params) {
              if (params.length > 0) {
                reject()
              } else {
                res()
              }
            })
          }
          else {
            resolve()
          }
        }))
      }//end for
    })
  }).then(json => {
    res.status(200).json(0)
  }).catch(json => {
    res.status(200).json(1)
  })
})

// router.get("/chkDel/:category_id", jwt.verify, urlencodedParser, function (req, res, next) {
//   let sql_chk = `SELECT count(annoucement_id) AS count FROM annoucements WHERE isDelete = '0' AND category_id = '${req.params.category_id}'`
//   ivr.query(sql_chk, function (response) {
//     res.status(200).json(response[0].count)
//   })
// })

router.post('/duplicate', jwt.verify, urlencodedParser, function (req, res, next) {
  let { id, name, copyName } = req.body;
  let created_by = req.uuid;
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let promise = new Promise((resolve, reject) => {
    let sql_chkName = `SELECT * FROM annoucements_category WHERE isDelete = '0' AND (name = '${name}' OR name like '${name} %')`
    ivr.query(sql_chkName, function (response) {
      helper.checkAILastId('annoucements_category', 'id', function (params) {
        let sql = `INSERT INTO annoucements_category (id,name,modified_dt) VALUES (${params},'${copyName}','${modified_dt}')`
        ivr.query(sql, function (response) {
          resolve(params)
        })
      })
    })
  }).then(json => {
    return new Promise((resolve, reject) => {
      let sql_item = `SELECT * FROM annoucements WHERE category_id = '${id}' AND isDelete = '0'`
      ivr.query(sql_item, function (response) {
        for (let i = 0, p = Promise.resolve(); i <= response.length; i++) {
          p = p.then(_ => new Promise(res => {
            if (i < response.length) {
              const element = response[i];
              let annoucement_id = uuidv1()
              let sql = `INSERT INTO annoucements (annoucement_id,annoucement_name,annoucement_desc,annoucement_voice_id,allow_key,allow_skip,action_id,action_value,created_by,created_dt,modified_by,modified_dt,category_id) 
                               VALUES ('${annoucement_id}', '${element.annoucement_name}', '${element.annoucement_desc == undefined ? "" : element.annoucement_desc}',
                               '${element.annoucement_voice_id}', '${element.allow_key}', '${element.allow_skip}', '${element.action_id}', '${element.action_value}', '${created_by}', '${modified_dt}','${created_by}', '${modified_dt}','${json}')`
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
             FROM annoucements 
             WHERE annoucement_name = '${req.query.annoucement_name}' 
                  AND category_id = '${req.query.category_id}' 
                  AND isDelete = '0' 
                  AND annoucement_id NOT IN ('${req.query.annoucement_id}')`
  ivr.query(sql, function (response) {
    res.status(200).json(response.length)
  })
})

router.get("/chk-category", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT * 
             FROM annoucements_category 
             WHERE name = '${req.query.name}' 
                  AND id NOT IN ('${req.query.id}')
                  AND isDelete = '0'`
  ivr.query(sql, function (response) {
    res.status(200).json(response.length)
  })
})

router.post("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let { annoucement_id, annoucement_name, annoucement_desc, annoucement_voice_id, allow_key, allow_skip, action_id, action_value, category_id } = req.body
  if (annoucement_id) {
    let uuid = req.uuid;
    let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
    let sql = ` UPDATE annoucements
                  SET annoucement_name = '${annoucement_name}',
                      annoucement_desc = '${annoucement_desc == undefined ? "" : annoucement_desc}',
                      annoucement_voice_id = '${annoucement_voice_id}',
                      allow_key = '${allow_key}',
                      allow_skip = '${allow_skip ? 1 : 0}',
                      action_id = '${action_id}',
                      action_value = '${action_value}',
                      modified_by = '${uuid}',
                      modified_dt = '${modified_dt}',
                      category_id = '${category_id}'
                  WHERE annoucement_id = '${req.body.annoucement_id}'`
    ivr.query(sql, function (response) {
      if (response) res.status(200).json({
        alert: helper.alertToast(`ANNOUCEMENTS`, `Update Annoucements Error`, `danger`),
      })
      res.status(200).json({
        alert: helper.alertToast(`ANNOUCEMENTS`, `Update Annoucements Successfully`, `success`),
      })
    })
  } else {
    let annoucement_id = uuidv1()
    let created_by = req.uuid;
    let created_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
    let sql = `INSERT INTO annoucements (annoucement_id,annoucement_name,annoucement_desc,annoucement_voice_id,allow_key,allow_skip,action_id,action_value,created_by,created_dt,modified_by,modified_dt,category_id) 
                     VALUES ('${annoucement_id}', '${annoucement_name}', '${annoucement_desc == undefined ? "" : annoucement_desc}', '${annoucement_voice_id}', '${allow_key}', '${allow_skip ? 1 : 0}', '${action_id}', '${action_value}', '${created_by}', '${created_dt}','${created_by}', '${created_dt}','${category_id}')`
    ivr.query(sql, function (response) {
      if (response) {
        res.status(200).json({
          alert: helper.alertToast(`ANNOUCEMENTS`, `Create Annoucements Error`, `danger`),
        })
      }
      else {
        res.status(200).json({
          alert: helper.alertToast(`ANNOUCEMENTS`, `Create Annoucements Successfully`, `success`),
        })
      }
    })
  }
})

router.get("/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let id = req.params.id
  let sql = `SELECT  
                annoucement_id,
                annoucement_name,
                annoucement_desc,
                annoucement_voice_id,
              CASE
                WHEN allow_skip =1 THEN 'true'
                ELSE 'false'
              END as allow_skip ,
                allow_key,
                action_id,
                action_value,
                created_by,
                created_dt,
                modified_by,
                modified_dt,
                isDelete,
              CASE
                WHEN action_id=1 THEN ''
                WHEN action_id=2 THEN ''
                WHEN action_id=4 THEN ''
                WHEN action_id=6 THEN ''
                ELSE action_value
              END as [external]
             FROM annoucements 
             WHERE annoucement_id = '${id}'`
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
    if (response) {
      res.status(200).json({
        alert: helper.alertToast(`ANNOUCEMENTS`, `Delete Annoucements Error`, `danger`),
      })
    }
    else {
      res.status(200).json({
        alert: helper.alertToast(`ANNOUCEMENTS`, `Delete Annoucements Successfully`, `success`),
      })
    }
  })
})

module.exports = router;