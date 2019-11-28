const express = require("express");
const router = express.Router();
const ivr = require("../../models/connect_ivr");
const bodyParser = require("body-parser");
const jwt = require("../../models/jwt");
const moment = require('moment');

var urlencodedParser = bodyParser.urlencoded({
  extended: true
});

router.get("/action", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT * FROM action WHERE isDelete = '0'`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})
router.get("/key", jwt.verify, urlencodedParser, function (req, res, next) {
  let sql = `SELECT * FROM keyphone WHERE isDelete = '0'`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

module.exports = router;