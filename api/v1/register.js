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
  let { username, password, fname, lname, company_uuid } = req.body
  if (company_uuid) { company_uuid = `'${company_uuid}'` }
  else if (req.company_uuid) { company_uuid = `'${req.company_uuid}'` }
  else { company_uuid = null }
  let promise = new Promise((resolve, reject) => {
    let sql = `SELECT uuid FROM users WHERE username = '${username}';`
    db.query(sql, function (response) {
      if (response.length == 0) { resolve() }
      else { res.status(400).json('Duplicate username') }
    })
  }).then(json => {
    return new Promise((resolve, reject) => {
      let sql = `INSERT INTO users (uuid, username, password, fname, lname, created_dt, created_by, company_uuid) 
             VALUES ('${uuid}', '${username}', '${password}', '${fname}', '${lname}', '${created_dt}', '${created_by}', ${company_uuid})`
      db.query(sql, function (response) {
        res.status(201).json()
      })
    })
  })
})

module.exports = router;