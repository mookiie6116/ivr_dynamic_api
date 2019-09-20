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
  let sql = `SELTCT * FROM action`
  ivr.query(sql, function (response) {
    res.status(200).json(response)
  })
})

module.exports = router;