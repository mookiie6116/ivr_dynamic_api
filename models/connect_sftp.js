let Client = require('ssh2-sftp-client');
const configs = require('config');
const fs = require("fs")
let sftp = new Client();
const config = configs.get('ftp');
const ftp_path = configs.get('ftp_path');
module.exports = {
  connect: function () {
    sftp.connect(config).then(() => {
      return sftp.list('/pathname');
    }).then((data) => {
      console.log(data, 'the data info');
    }).catch((err) => {
      console.log(err, 'catch error');
    });
  },
  upload: function (localFilePath,filename) {
    let dataFile = fs.createReadStream(localFilePath);
    
    sftp.connect(config).then((data) => {
      sftp.put(dataFile, `${ftp_path}/${filename}`).then((res) => {
        console.log(res, 'then');
      }).catch((err) => {
        console.log(err, 'catch error');
      })
    })
  }
}