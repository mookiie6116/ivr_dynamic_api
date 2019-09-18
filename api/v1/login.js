const express = require("express");
const router = express.Router();
const db = require("./../../models/connectdb");
const jwt = require("./../../models/jwt");
const bodyParser = require("body-parser");
const md5 = require("md5")

var urlencodedParser = bodyParser.urlencoded({
  extended: false
});

router.post("/", urlencodedParser, function (req, res, next) {
  let { username, password } = req.body
  let sql = `SELECT uuid, username, fname, lname, company_uuid FROM users WHERE username = '${username}' AND password = '${md5(password)}'`
  db.query(sql,function (response) {
    if(response.length){
      const token = jwt.sign(response[0]);
      res.status(200).json(token)
    }else{
      res.status(400).json()
    }
  })
})

router.post("/", urlencodedParser, function (req, res, next) {

})



module.exports = router;