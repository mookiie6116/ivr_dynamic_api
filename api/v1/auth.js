const express = require("express");
const router = express.Router();
const ivr = require("../../models/connect_ivr");
const jwt = require("../../models/jwt");
const bodyParser = require("body-parser");
const md5 = require("md5")
const helper = require('../helper/helper')

var urlencodedParser = bodyParser.urlencoded({
  extended: true
});

router.post("/login", urlencodedParser, function (req, res, next) {
  let { username, password } = req.body
  let sql = `SELECT uuid, username, fname, lname FROM users WHERE username = '${username}' AND password = '${md5(password)}'`
  ivr.query(sql, function (response) {
    if (response.length) {
      const token = jwt.sign(response[0]);
      res.status(200).json({
        alert: helper.alertToast(`LOGIN`, `Login Success`, `success`),
        token: token
      })
    } else {
      res.status(200).json({
        alert: helper.alertToast(`LOGIN`, `Username OR Password Incorrect`,`danger`),
        token: ''
      })
    }
  })
})

router.get("/logout", jwt.verify, urlencodedParser, function (req, res, next) {
  res.status(200).json({
    alert: helper.alertToast(`LOGOUT`, `Logout Success`, `success`),
  })
})

router.put("/reset_password", jwt.verify, urlencodedParser, function (req, res, next) {
  res.status(200).json({
    alert: helper.alertToast(`RESET PASSWORD`, `Reset Password Success`, `success`),
  })
})

router.get("/me", jwt.verify, urlencodedParser, function (req, res, next) {
  let uuid = req.uuid;
  let sql = `SELECT username,	fname,	lname	 FROM users WHERE uuid = '${uuid}'`
  ivr.query(sql, function (response) {
    if (response.length) {
      res.status(200).json(response[0])
    } else {
      res.status(404).json("data not found!")
    }
  })
})

module.exports = router;