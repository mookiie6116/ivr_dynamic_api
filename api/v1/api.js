const express = require('express');
const router = express.Router();
const moment = require('moment');
moment.locale('th');

router.use("/auth", require("./auth"));
router.use("/users", require("./users"));
router.use("/mapping", require("./mapping"));
router.use("/annoucement", require("./annoucement"));
router.use("/timeConditions", require("./time_conditions"));
router.use("/script", require("./script"));
router.use("/audio", require("./audio"));
router.use("/master", require("./master"));
router.use("/help", require("./helper"));
// router.use('/',function (req, res) {res.send('hello')})
module.exports = router;