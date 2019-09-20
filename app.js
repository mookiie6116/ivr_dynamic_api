const express = require("express");
const path = require('path')
const cors = require('cors')
const app = express();
const bodyParser = require("body-parser");
const config = require('config');
let ver = config.get('ver');
var ivr = require("./models/connect_ivr");

const http = require("http").Server(app);
const port = process.env.PORT || config.get('port');
ivr.connect()
app.use(bodyParser.json({limit: '10mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}))
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/v1', require('./api/v1/api'));

app.get('/',(req,res)=>{
  res.send('hello')
})

http.listen(port, () => {
  console.log(`Running version ${ver} on Port: ${port}`);
});
