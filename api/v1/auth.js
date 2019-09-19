const express = require("express");
const router = express.Router();
const ivr = require("../../models/connect_ivr");
const jwt = require("../../models/jwt");
const bodyParser = require("body-parser");
const md5 = require("md5")

var urlencodedParser = bodyParser.urlencoded({
  extended: false
});

router.post("/login", urlencodedParser, function (req, res, next) {
  let { username, password } = req.body
  let sql = `SELECT uuid, username, fname, lname FROM users WHERE username = '${username}' AND password = '${md5(password)}'`
  ivr.query(sql,function (response) {
    if(response.length){
      const token = jwt.sign(response[0]);
      res.status(200).json(token)
    }else{
      res.status(400).json()
    }
  })
})

router.get("/logout",jwt.verify, urlencodedParser, function (req, res, next) {
  res.status(200).json()
})

router.put("/reset_password",jwt.verify,urlencodedParser,function (req, res, next) {
  res.status(200).json()
})

module.exports = router;