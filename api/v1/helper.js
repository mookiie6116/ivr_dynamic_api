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

router.get("/chkdel/:id", jwt.verify, urlencodedParser, function (req, res, next) {
  let id = req.params.id
  let sql = `EXEC spCheckDelete '${id}'`
  ivr.query(sql, function (response) {
      res.status(200).json(response)
  })
})

module.exports = router;