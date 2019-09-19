const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
var publicKEY = fs.readFileSync(path.join(__dirname + "/public.key"), "utf8");
var privateKEY = fs.readFileSync(path.join(__dirname + "/private.key"), "utf8");

var i = "Terrabit"; // Issuer (Software organization who issues the token)
var s = "IVR"; // Subject (intended user of the token)
var a = ""; // Audience (Domain within which this token will live and function)

module.exports = {
  sign: payload => {
    // Token signing options
    var signOptions = {
      issuer: i,
      subject: s,
      audience: a,
      expiresIn: "1 years", // 1 years / hour / minute / days / default ms
      algorithm: "RS256"
    };
    return jwt.sign(payload, privateKEY, signOptions);
  },
  verify: (req, res, next) => {
    //next();
    var token = req.headers["x-access-token"];
    if (!token)
      return res
        .status(403)
        .send({ auth: false, message: "No token provided." });

    var verifyOptions = {
      issuer: i,
      subject: s,
      audience: a,
      expiresIn: "1d",
      algorithm: ["RS256"]
    };
    jwt.verify(token, publicKEY, verifyOptions, function(err, decoded) {
      if (err)
        return res
          .status(403)
          .send({ auth: false, message: "Failed to authenticate token." });
      req.uuid = decoded.uuid;
      req.username = decoded.username;
      req.fname = decoded.fname;
      req.lname = decoded.lname;
      next();
    });
  }
};
