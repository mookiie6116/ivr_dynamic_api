const express = require("express");
const router = express.Router();
const ivr = require("../../models/connect_ivr");
const bodyParser = require("body-parser");
const jwt = require("../../models/jwt");
const uuidv1 = require('uuid/v1');
const moment = require('moment');
const md5 = require("md5")

var urlencodedParser = bodyParser.urlencoded({
  extended: false
});

router.post("/", jwt.verify, urlencodedParser, function (req, res, next) {
  
})



module.exports = router;