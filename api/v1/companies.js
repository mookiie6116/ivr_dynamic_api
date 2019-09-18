const express = require("express");
const router = express.Router();
const db = require("./../../models/connectdb");
const bodyParser = require("body-parser");
const jwt = require("./../../models/jwt");
const uuidv1 = require('uuid/v1');
const moment = require('moment');

var urlencodedParser = bodyParser.urlencoded({
  extended: false
});

router.post("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let uuid = uuidv1()
  let created_by = req.username;
  let created_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let { name } = req.body
  let promise = new Promise((resolve, reject) => {
    let sql = `SELECT uuid FROM companies WHERE name = '${name}';`
    db.query(sql, function (response) {
      if (response.length == 0) { resolve() }
      else { res.status(400).json('Duplicate Name') }
    })
  }).then(json => {
    return new Promise((resolve, reject) => {
      let sql = `INSERT INTO companies (uuid, name, created_dt, created_by) 
             VALUES ('${uuid}', '${name}', '${created_dt}', '${created_by}')`
      db.query(sql, function (response) {
        res.status(201).json()
      })
    })
  })
})

router.put("/:id",jwt.verify, urlencodedParser, function (req, res, next) {

})
router.delete("/:id",jwt.verify, urlencodedParser, function (req, res, next) {

})

module.exports = router;