const express = require("express");
const router = express.Router();
const ivr = require("../../models/connect_ivr");
const bodyParser = require("body-parser");
const jwt = require("../../models/jwt");
const uuidv1 = require('uuid/v1');
const moment = require('moment');
const md5 = require("md5")

var urlencodedParser = bodyParser.urlencoded({
  extended: true
});

router.post("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let uuid = uuidv1()
  let created_by = req.uuid;
  let created_dt = moment.utc().format('YYYY-MM-DD HH:mm:ss');
  let { username, password, fname, lname, company_uuid } = req.body
  let promise = new Promise((resolve, reject) => {
    let sql = `SELECT uuid FROM users WHERE username = '${username}';`
    ivr.query(sql, function (response) {
      if (response.length == 0) { resolve() }
      else { res.status(400).json('Duplicate username') }
    })
  }).then(json => {
    return new Promise((resolve, reject) => {
      let sql = `INSERT INTO users (uuid, username, password, fname, lname, created_dt, created_by) 
             VALUES ('${uuid}', '${username}', '${md5(password)}', '${fname}', '${lname}', '${created_dt}', '${created_by}')`
      ivr.query(sql, function (response) {
        res.status(201).json()
      })
    })
  })
})

router.get("/", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELTCT * FROM users`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

router.get("/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let id = req.params.id
  let sql = `SELTCT * FROM users WHERE uuid = ${id}`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

module.exports = router;