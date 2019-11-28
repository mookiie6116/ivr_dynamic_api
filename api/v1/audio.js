const express = require("express");
const router = express.Router();
const ivr = require("../../models/connect_ivr");
const ftp = require("../../models/connect_sftp");
const bodyParser = require("body-parser");
const jwt = require("../../models/jwt");
const path = require('path');
const fs = require('fs-extra');
const uuidv1 = require('uuid/v1');
const moment = require('moment');
const formidable = require('formidable');
const helper = require('../helper/helper')
const { spawn } = require("child_process"); //exec process

var urlencodedParser = bodyParser.urlencoded({
  extended: true,
  limit: '10mb'
});

router.get("/category", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT * FROM voice_config_category WHERE isDelete = '0' ORDER BY name ASC`;
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.get("/category/:id", jwt.verify, function (req, res, next) {
  let sql = `SELECT a.*,c.name as category,
                CONCAT(bc.fname,' ',bc.lname) AS name_created,
                CONCAT(bm.fname,' ',bm.lname) AS name_modified
              FROM voice_config a
                LEFT JOIN users bc ON a.created_by = bc.uuid
                LEFT JOIN users bm ON a.modified_by = bm.uuid
                LEFT JOIN voice_config_category c ON a.category_id = c.id `
  if (req.params.id == 0) {
    sql += ` ORDER BY c.name,a.voice_name ASC`
  } else {
    sql += ` WHERE a.category_id = '${req.params.id}'
            ORDER BY a.voice_name ASC`
  }
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.post("/category", jwt.verify, urlencodedParser, function (req, res, next) {
  let { id, name } = req.body
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  if (id) {
    let sql = `UPDATE voice_config_category
                  SET name = '${name}',
                  modified_dt = '${modified_dt}'
                  WHERE id = '${id}'`
    ivr.query(sql, function (response) {
      if (response) {
        res.status(200).json({
          alert: helper.alertToast(`VOICE`, `Create Category Error`, `danger`),
        })
      }
      else {
        res.status(200).json({
          alert: helper.alertToast(`VOICE`, `Create Category Successfully`, `success`),
        })
      }

    })
  } else {
    helper.checkAILastId('voice_config_category', 'id', function (params) {
      let sql = `INSERT INTO voice_config_category (id,name,modified_dt) VALUES (${params},'${name}','${modified_dt}')`
      ivr.query(sql, function (response) {
        if (response) res.status(200).json({
          alert: helper.alertToast(`VOICE`, `Create Category Error`, `danger`),
        })
        res.status(200).json({
          alert: helper.alertToast(`VOICE`, `Create Category Successfully`, `success`),
        })
      })
    })
  }
})

router.delete("/category/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let modified_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let sql = ` UPDATE voice_config_category 
              SET isDelete = '1', 
                  modified_dt = '${modified_dt}' 
              WHERE id = '${req.params.id}'`
  ivr.query(sql, function (response) {
    if (response) {
      res.status(200).json({
        alert: helper.alertToast(`VOICE`, `Delete Voice Category Error`, `danger`),
      })
    }
    else {
      res.status(200).json({
        alert: helper.alertToast(`VOICE`, `Delete Voice Category Successfully`, `success`),
      })
    }
  })
})

router.get("/chkDel/:category_id", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql_chk = `SELECT count(voice_id) AS count FROM voice_config WHERE category_id = '${req.params.category_id}'`
  ivr.query(sql_chk, function (response) {
    res.status(200).json(response[0].count)
  })
})

router.get("/chk", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT * 
             FROM voice_config 
             WHERE voice_name = '${req.query.voice_name}' 
                  AND category_id = '${req.query.category_id}' 
                  AND voice_id NOT IN ('${req.query.voice_id}')`
  ivr.query(sql, function (response) {
    res.status(200).json(response.length)
  })
})

router.get("/chk-category", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT * 
             FROM voice_config_category 
             WHERE name = '${req.query.name}' 
                  AND id NOT IN ('${req.query.id}')
                  AND isDelete = '0'`
  ivr.query(sql, function (response) {
    res.status(200).json(response.length)
  })
})

router.post("/", jwt.verify, urlencodedParser, function (req, res, next) {
  //original code
  let { voice_id, voice_name, audioName, voice_description, audio, category_id } = req.body
  let created_by = req.uuid;
  let created_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  if (voice_id) {
    let sql = ` UPDATE voice_config
                SET voice_name = '${voice_name}',
                    voice_description = '${voice_description}',
                    modified_by = '${created_by}',
                    modified_dt = '${created_dt}'
                WHERE voice_id = '${voice_id}'`
    ivr.query(sql, function (response) {
      if (response) res.status(200).json({
        alert: helper.alertToast(`VOICE`, `Edit Voice Error`, `danger`),
      })
      res.status(200).json({
        alert: helper.alertToast(`VOICE`, `Edit Voice Successfully`, `success`),
        voice_id: ''
      })
    })
  } else {
    let voice_id = uuidv1()
    var newfile = `${voice_id}.${audioName.split(".")[1]}`;
    let sql = `INSERT INTO voice_config (voice_id, voice_name, voice_description, voice_filename, voice_storage, created_dt, created_by, modified_dt, modified_by, category_id)
            VALUES ('${voice_id}', '${voice_name}', '${voice_description == undefined ? "" : voice_description}','${newfile}', '${audio}', '${created_dt}', '${created_by}', '${created_dt}', '${created_by}', '${category_id}')`
    ivr.query(sql, function (response) {
      if (response) res.status(200).json({
        alert: helper.alertToast(`VOICE`, `Upload Voice Error`, `danger`),
      })
      res.status(200).json({
        alert: helper.alertToast(`VOICE`, `Upload Voice Successfully`, `success`),
        voice_id: voice_id
      })
    })
  }

  //end of line
})

router.post("/upload/:id", jwt.verify, function (req, res, next) {
  var id = req.params.id;
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    var audio = files.audio
    var oldpath = audio.path;
    var newfile = `${id}.${audio.name.split(".")[1]}`;
    var newpath = path.resolve("uploads") + "/" + newfile;
    fs.remove(newpath)
    fs.move(oldpath, newpath, function (err) {
      if (err) {
      } else {
        let isOk = false
        let info = spawn(".\\lib\\sox.exe", [`--i -d uploads/${newfile}`], { shell: true })
        info.stdout.on("data", data => {
          isOk = true
          let duration = data.toString().replace("\r\n", "")
          let sql = `UPDATE voice_config
                        SET duration_time = '${duration}'
                        WHERE voice_id = '${req.params.id}'`
          ivr.query(sql, function (response) {
            ftp.upload(newpath, newfile)
            res.status(204).send()
          })
        })
        info.stderr.on("data", data => {
          if (!isOk) res.status(200).json({
            alert: helper.alertToast(`VOICE`, `Upload Voice Error`, `danger`),
          })
        });
      }
    });
  })
})

router.get("/", jwt.verify, function (req, res, next) {
  let sql = `SELECT a.*,
                CONCAT(b.fname,' ',b.lname) AS name_created
              FROM voice_config a
                LEFT JOIN users b ON a.created_by = b.uuid`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.get("/:id", jwt.verify, function (req, res, next) {
  let sql = `SELECT voice_id,
                    voice_name,
                    voice_description,
                    voice_storage,
                    duration_time
              FROM voice_config
              WHERE voice_id = '${req.params.id}'`
  ivr.query(sql, function (response) {
    if (response.length) {
      res.status(200).json(response[0])
    } else {
      res.status(200).json(response)
    }
  })
})

module.exports = router;