const express = require('express');
const router = express.Router();
const moment = require('moment');
moment.locale('th');

router.use("/auth", require("./auth"));
router.use("/users", require("./users"));
router.use("/service", require("./mapping"));
// router.use('/',function (req, res) {res.send('hello')})
module.exports = router;