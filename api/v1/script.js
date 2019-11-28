const express = require("express");
const router = express.Router();
const ivr = require("../../models/connect_ivr");
const bodyParser = require("body-parser");
const jwt = require("../../models/jwt");
const uuidv1 = require('uuid/v1');
const helper = require('../helper/helper')
const moment = require('moment');

var urlencodedParser = bodyParser.urlencoded({
  extended: true
});


router.get("/category", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT * FROM ivr_script_category WHERE isDelete = '0' ORDER BY name ASC`;
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.get("/category/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT a.*, d.name as category,
              CASE
                WHEN LEN(a.description) > 20 THEN CONCAT(SUBSTRING(a.description, 0, 20),'...')
                ELSE a.description
              END AS description_topic,
              CONCAT(b.fname,' ',b.lname) AS name_created,
              CONCAT(c.fname,' ',c.lname) AS name_modified
            FROM ivr_script a
            LEFT JOIN users b ON a.created_by = b.uuid
            LEFT JOIN users c ON a.modified_by = c.uuid
            LEFT JOIN ivr_script_category d ON a.category_id = d.id
            WHERE a.isDelete = '0'`
  if (req.params.id == 0) {
    sql += ` ORDER BY d.name,a.name ASC`
  } else {
    sql += ` AND a.category_id = '${req.params.id}'
            ORDER BY a.name ASC`
  }

  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.post("/category", jwt.verify, urlencodedParser, function (req, res, next) {
  let { id, name } = req.body
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  if (id) {
    let sql = `UPDATE ivr_script_category
                  SET name = '${name}',
                  modified_dt = '${modified_dt}'
                  WHERE id = '${id}'`
    ivr.query(sql, function (response) {
      if (response) {
        res.status(200).json({
          alert: helper.alertToast(`IVR`, `Create Category Error`, `danger`),
        })
      }
      else {
        res.status(200).json({
          alert: helper.alertToast(`IVR`, `Create Category Successfully`, `success`),
        })
      }

    })
  } else {
    helper.checkAILastId('ivr_script_category', 'id', function (params) {
      let sql = `INSERT INTO ivr_script_category (id,name,modified_dt) VALUES (${params},'${name}','${modified_dt}')`
      ivr.query(sql, function (response) {
        if (response) res.status(200).json({
          alert: helper.alertToast(`IVR`, `Create Category Error`, `danger`),
        })
        res.status(200).json({
          alert: helper.alertToast(`IVR`, `Create Category Successfully`, `success`),
        })
      })
    })
  }
})

router.delete("/category/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let uuid = req.uuid;
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  return new Promise((resolve, reject) => {
    let sql = ` UPDATE ivr_script_category 
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
    let sql_chk = `SELECT ivr_id as id FROM ivr_script WHERE isDelete = '0' AND category_id = '${req.params.id}'`
    ivr.query(sql_chk, function (response) {
      for (let i = 0, p = Promise.resolve(); i <= response.length; i++) {
        p = p.then(_ => new Promise(res => {
          if (i < response.length) {
            let element = response[i]
            let sql = ` UPDATE ivr_script 
                          SET isDelete = '1', 
                              modified_by = '${uuid}', 
                              modified_dt = '${modified_dt}' 
                          WHERE ivr_id = '${element.id}'`
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
      alert: helper.alertToast(`IVR`, `Delete IVR Category Successfully`, `success`),
    })
  }).catch(json => {
    res.status(200).json({
      alert: helper.alertToast(`IVR`, `Delete IVR Category Successfully`, `success`),
    })
  })
})

router.get("/chkDel/:category_id", jwt.verify, urlencodedParser, function (req, res, next) {
  return new Promise((resolve, reject) => {
    let sql_chk = `SELECT ivr_id as id FROM ivr_script WHERE isDelete = '0' AND category_id = '${req.params.category_id}'`
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

router.post('/duplicate', jwt.verify, urlencodedParser, function (req, res, next) {
  let { id, name, copyName } = req.body;
  let created_by = req.uuid;
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let promise = new Promise((resolve, reject) => {
    let sql_chkName = `SELECT * FROM ivr_script_category WHERE name = '${name}' OR name like 'copy ${name}(%' AND isDelete = '0'`
    ivr.query(sql_chkName, function (response) {
      helper.checkAILastId('ivr_script_category', 'id', function (params) {
        let sql = `INSERT INTO ivr_script_category (id,name,modified_dt) VALUES (${params},'${copyName}','${modified_dt}')`
        ivr.query(sql, function (response) {
          resolve(params)
        })
      })
    })
  }).then(json => {
    return new Promise((resolve, reject) => {
      let sql_item = `SELECT * FROM ivr_script WHERE category_id = '${id}' AND isDelete = '0'`
      ivr.query(sql_item, function (response) {
        for (let i = 0, p = Promise.resolve(); i <= response.length; i++) {
          p = p.then(_ => new Promise(res => {
            if (i < response.length) {
              const element = response[i];
              let ivr_id = uuidv1()
              let sql = `INSERT INTO ivr_script (ivr_id, name, description, voice_id, timeout, invalid_retries, invalid_retries_voice_id, invalid_voice_id, invalid_action_id, invalid_action_value, timeout_retries, timeout_retries_voice_id, timeout_voice_id, timeout_action_id, timeout_action_value, created_by, created_dt,modified_by,modified_dt,category_id) 
                        VALUES ('${ivr_id}', '${element.name}', '${element.description == undefined ? "" : element.description}', '${element.voice_id}', '${element.timeout}', '${element.invalid_retries}', '${element.invalid_retries_voice_id}', '${element.invalid_voice_id}', '${element.invalid_action_id}', '${element.invalid_action_value}', 
                        '${element.timeout_retries}', '${element.timeout_retries_voice_id}', '${element.timeout_voice_id}', '${element.timeout_action_id}', '${element.timeout_action_value}', '${created_by}', '${modified_dt}',  '${created_by}', '${modified_dt}','${json}')`
              ivr.query(sql, function (responseInsertItem) {
                if (responseInsertItem) {
                  reject(json)
                } else {
                  let sql_item = `SELECT * FROM ivr_script_key_detail WHERE ivr_id = '${element.ivr_id}'`
                  ivr.query(sql_item, function (responseItem) {
                    for (let d = 0, p = Promise.resolve(); d <= responseItem.length; d++) {
                      p = p.then(_ => new Promise(resItem => {
                        if (d < responseItem.length) {
                          const elementItem = responseItem[d];
                          let sql_keyDetail = `INSERT INTO ivr_script_key_detail (ivr_id, key_press, key_action_id, key_action_value)
                                              VALUES ('${ivr_id}','${elementItem.key_press}', '${elementItem.key_action_id}', '${elementItem.external ? elementItem.external : elementItem.key_action_value}');`
                          ivr.query(sql_keyDetail, function (response) {
                            if (responseInsertItem) {
                              reject(json)
                            } else {
                              resItem(response)//end promise loop INSERT ivr_script_key_detail
                            }
                          })
                        } else {
                          res(response)//end promise loop INSERT ivr_script
                        }
                      }))
                    }//end loop insert ivr_script_key_detail
                  })
                }
              })
            }
            else {
              resolve(json)//end promise main
            }
          }))
        }//end loop insert ivr_script with ivr_script_key_detail
      })
    })
  }).then(json => {
    res.status(200).json({
      alert: helper.alertToast(`ANNOUCEMENTS`, `Copy Category Successfully`, `success`),
    })
  })
  // .catch(json => {
  //   console.log(error);
  // })
})

router.get("/chk", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT *
             FROM ivr_script
             WHERE name = '${req.query.name}'
                  AND category_id = '${req.query.category_id}'
                  AND isDelete = '0'
                  AND ivr_id NOT IN ('${req.query.ivr_id}')`
  ivr.query(sql, function (response) {
    res.status(200).json(response.length)
  })
})

router.get("/chk-category", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT * 
             FROM ivr_script_category 
             WHERE name = '${req.query.name}' 
              AND id NOT IN ('${req.query.id}')
              AND isDelete = '0'`
  ivr.query(sql, function (response) {
    res.status(200).json(response.length)
  })
})

router.get("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT a.* ,
                CASE
                  WHEN LEN(a.description) > 20 THEN CONCAT(SUBSTRING(a.description, 0, 20),'...')
                  ELSE a.description
                END AS description_topic,
                CONCAT(b.fname,' ',b.lname) AS name_created,
                CONCAT(c.fname,' ',c.lname) AS name_modified
              FROM ivr_script a
              LEFT JOIN users b ON a.created_by = b.uuid
              LEFT JOIN users c ON a.modified_by = c.uuid
              WHERE a.isDelete = '0'`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.get("/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let id = req.params.id
  let dataset = {}
  let promise = new Promise((resolve, reject) => {
    let sql = `SELECT * 
               FROM ivr_script 
               WHERE ivr_id = '${id}'`
    ivr.query(sql, function (response) {
      if (response.length > 0) {
        dataset = response
        resolve(dataset[0])
      } else { res.status(200).json('Data Not Found') }
    })
  }).then(function (json) {
    return new Promise((resolve, reject) => {
      let sql_keyDetail = `SELECT * ,
                            CASE
                              WHEN key_action_id = 5 THEN key_action_value
                              ELSE ''
                            END as [external]
                           FROM ivr_script_key_detail
                           WHERE ivr_id ='${id}'`
      ivr.query(sql_keyDetail, function (response) {
        json.invalid_action = { key_action_id: json.invalid_action_id, key_action_value: json.invalid_action_value, external: json.invalid_action_id == 5 ? json.invalid_action_value : '' }
        json.timeout_action = { key_action_id: json.timeout_action_id, key_action_value: json.timeout_action_value, external: json.invalid_action_id == 5 ? json.invalid_action_value : '' }
        json.keyDetail = response
        resolve(json)
      })
    })
  }).then(function (json) {
    res.status(200).json(json)
  })
})

router.delete("/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let uuid = req.uuid;
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let sql = ` UPDATE ivr_script 
              SET isDelete = '1', 
                  modified_by = '${uuid}', 
                  modified_dt = '${modified_dt}' 
              WHERE ivr_id = '${req.params.id}'`
  ivr.query(sql, function (response) {
    if (response) { res.status(200).json({ alert: helper.alertToast(`IVR`, `Delete IVR Error`, `danger`) }) }
    else { res.status(200).json({ alert: helper.alertToast(`IVR`, `Deleted IVR Successfully`, `success`) }) }
  })
})

router.post("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let { ivr_id, name, description, voice_id, timeout, invalid_retries, invalid_retries_voice_id, invalid_voice_id, invalid_action, timeout_retries, timeout_retries_voice_id, timeout_voice_id, timeout_action, keyDetail, category_id } = req.body
  let created_by = req.uuid;
  let created_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  if (ivr_id) {
    let uuid = req.uuid;
    let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
    let promise = new Promise((resolve, reject) => {
      let sql = ` UPDATE ivr_script
                  SET name = '${name}',
                      description = '${description == undefined ? "" : description}',
                      voice_id = '${voice_id}',
                      timeout = '${parseInt(timeout)}',
                      invalid_retries = '${invalid_retries}',
                      invalid_retries_voice_id = '${invalid_retries_voice_id}',
                      invalid_voice_id = '${invalid_voice_id}',
                      invalid_action_id = '${invalid_action.key_action_id}',
                      invalid_action_value = '${invalid_action.key_action_value}',
                      timeout_retries = '${timeout_retries}',
                      timeout_retries_voice_id = '${timeout_retries_voice_id}',
                      timeout_voice_id = '${timeout_voice_id}',
                      timeout_action_id = '${timeout_action.key_action_id}',
                      timeout_action_value = '${timeout_action.key_action_value}',
                      modified_by = '${uuid}', 
                      modified_dt = '${modified_dt}' 
                  WHERE ivr_id = '${req.body.ivr_id}'`
      ivr.query(sql, function (response) {
        resolve(req.body.ivr_id)
      })
    }).then(function (json) {
      return new Promise((resolve, reject) => {
        let sql_deletekeyDetail = `DELETE FROM ivr_script_key_detail WHERE ivr_id ='${json}';`
        ivr.query(sql_deletekeyDetail, function (response) {
          resolve(json)
        })
      })
    }).then(function (json) {
      return new Promise((resolve, reject) => {
        for (let i = 0, p = Promise.resolve(); i <= keyDetail.length; i++) {
          p = p.then(_ => new Promise(res => {
            if (i < keyDetail.length) {
              const element = keyDetail[i];
              let sql_keyDetail = `INSERT INTO ivr_script_key_detail (ivr_id, key_press, key_action_id, key_action_value)
                                          VALUES ('${json}','${element.key_press}', '${element.key_action_id}', '${element.external ? element.external : element.key_action_value}');`
              ivr.query(sql_keyDetail, function (response) {
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
      res.status(200).json({
        alert: helper.alertToast(`IVR`, `Update IVR Successfully`, `success`),
      })
    })
  } else {
    let promise = new Promise((resolve, reject) => {
      let ivr_id = uuidv1()
      let sql = `INSERT INTO ivr_script (ivr_id, name, description, voice_id, timeout, invalid_retries, invalid_retries_voice_id, invalid_voice_id, invalid_action_id, invalid_action_value, timeout_retries, timeout_retries_voice_id, timeout_voice_id, timeout_action_id, timeout_action_value, created_by, created_dt,modified_by,modified_dt,category_id) 
        VALUES ('${ivr_id}', '${name}', '${description == undefined ? "" : description}', '${voice_id}', '${parseInt(timeout)}', '${invalid_retries}', '${invalid_retries_voice_id}', '${invalid_voice_id}', '${invalid_action.key_action_id}', '${invalid_action.key_action_value}', '${timeout_retries}', '${timeout_retries_voice_id}', '${timeout_voice_id}', '${timeout_action.key_action_id}', '${timeout_action.key_action_value}', '${created_by}', '${created_dt}',  '${created_by}', '${created_dt}','${category_id}')`
      ivr.query(sql, function (response) {
        resolve(ivr_id)
      })
    }).then(function (json) {
      return new Promise((resolve, reject) => {
        for (let i = 0, p = Promise.resolve(); i <= keyDetail.length; i++) {
          p = p.then(_ => new Promise(res => {
            if (i < keyDetail.length) {
              const element = keyDetail[i];
              let sql_keyDetail = `INSERT INTO ivr_script_key_detail (ivr_id, key_press, key_action_id, key_action_value)
                                      VALUES ('${json}','${element.key_press}', '${element.key_action_id}', '${element.external ? element.external : element.key_action_value}');`
              ivr.query(sql_keyDetail, function (response) {
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
      res.status(201).json({
        alert: helper.alertToast(`IVR`, `Create IVR Successfully`, `success`),
      })
    })
  }
})

// router.post("/", jwt.verify, urlencodedParser, function (req, res, next) {
//   let { ivr_id, name, description, voice_id, timeout, invalid_retries, invalid_retries_voice_id, invalid_voice_id, invalid_action, timeout_retries, timeout_retries_voice_id, timeout_voice_id, timeout_action, keyDetail } = req.body
//   let created_by = req.uuid;
//   let created_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
//   let promise = new Promise((resolve, reject) => {
//     let sql = `SELECT * FROM ivr_script WHERE name = '${name}' AND isDelete = '0'`
//     ivr.query(sql, function (response) {
//       if (response.length == 0) { resolve() }
//       else {
//         let uuid = req.uuid;
//         let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
//         let promise = new Promise((resolve, reject) => {
//           let sql = ` UPDATE ivr_script
//                     SET description = '${description == undefined ? "" : description}',
//                         voice_id = '${voice_id}',
//                         timeout = '${timeout}',
//                         invalid_retries = '${invalid_retries}',
//                         invalid_retries_voice_id = '${invalid_retries_voice_id}',
//                         invalid_voice_id = '${invalid_voice_id}',
//                         invalid_action_id = '${invalid_action.key_action_id}',
//                         invalid_action_value = '${invalid_action.key_action_value}',
//                         timeout_retries = '${timeout_retries}',
//                         timeout_retries_voice_id = '${timeout_retries_voice_id}',
//                         timeout_voice_id = '${timeout_voice_id}',
//                         timeout_action_id = '${timeout_action.key_action_id}',
//                         timeout_action_value = '${timeout_action.key_action_value}',
//                         modified_by = '${uuid}', 
//                         modified_dt = '${modified_dt}' 
//                     WHERE ivr_id = '${req.body.ivr_id}'`
//           ivr.query(sql, function (response) {
//             resolve(req.body.ivr_id)
//           })
//         }).then(function (json) {
//           return new Promise((resolve, reject) => {
//             let sql_deletekeyDetail = `DELETE FROM ivr_script_key_detail WHERE ivr_id ='${json}';`
//             ivr.query(sql_deletekeyDetail, function (response) {
//               resolve(json)
//             })
//           })
//         }).then(function (json) {
//           return new Promise((resolve, reject) => {
//             for (let i = 0, p = Promise.resolve(); i <= keyDetail.length; i++) {
//               p = p.then(_ => new Promise(res => {
//                 if (i < keyDetail.length) {
//                   const element = keyDetail[i];
//                   let sql_keyDetail = `INSERT INTO ivr_script_key_detail (ivr_id, key_press, key_action_id, key_action_value)
//                                         VALUES ('${json}','${element.key_press}', '${element.key_action_id}', '${element.external ? element.external : element.key_action_value}');`
//                   ivr.query(sql_keyDetail, function (response) {
//                     res(response)
//                   })
//                 }
//                 else {
//                   resolve(json)
//                 }
//               }))
//             }
//           })
//         }).then(function (json) {
//           res.status(200).json({
//             alert: helper.alertToast(`IVR`, `Update IVR Successfully`, `success`),
//           })
//         })
//       }
//     })
//   }).then(function (json) {
//     return new Promise((resolve, reject) => {
//       let ivr_id = uuidv1()
//       let sql = `INSERT INTO ivr_script (ivr_id, name, description, voice_id, timeout, invalid_retries, invalid_retries_voice_id, invalid_voice_id, invalid_action_id, invalid_action_value, timeout_retries, timeout_retries_voice_id, timeout_voice_id, timeout_action_id, timeout_action_value, created_by, created_dt,modified_by,modified_dt) 
//       VALUES ('${ivr_id}', '${name}', '${description == undefined ? "" : description}', '${voice_id}', '${timeout}', '${invalid_retries}', '${invalid_retries_voice_id}', '${invalid_voice_id}', '${invalid_action.key_action_id}', '${invalid_action.key_action_value}', '${timeout_retries}', '${timeout_retries_voice_id}', '${timeout_voice_id}', '${timeout_action.key_action_id}', '${timeout_action.key_action_value}', '${created_by}', '${created_dt}',  '${created_by}', '${created_dt}')`
//       ivr.query(sql, function (response) {
//         resolve(ivr_id)
//       })
//     })
//   }).then(function (json) {
//     return new Promise((resolve, reject) => {
//       for (let i = 0, p = Promise.resolve(); i <= keyDetail.length; i++) {
//         p = p.then(_ => new Promise(res => {
//           if (i < keyDetail.length) {
//             const element = keyDetail[i];
//             let sql_keyDetail = `INSERT INTO ivr_script_key_detail (ivr_id, key_press, key_action_id, key_action_value)
//                                     VALUES ('${json}','${element.key_press}', '${element.key_action_id}', '${element.external ? element.external : element.key_action_value}');`
//             ivr.query(sql_keyDetail, function (response) {
//               res(response)
//             })
//           }
//           else {
//             resolve(json)
//           }
//         }))
//       }
//     })
//   }).then(function (json) {
//     res.status(201).json({
//       alert: helper.alertToast(`IVR`, `Create IVR Successfully`, `success`),
//     })
//   })
// })

module.exports = router;