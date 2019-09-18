const express = require('express');
const router = express.Router();
const moment = require('moment');
moment.locale('th');

router.use("/login", require("./login"));
router.use("/register", require("./register"));
router.use("/companies", require("./register"));
// router.use('/',function (req, res) {res.send('hello')})
module.exports = router;