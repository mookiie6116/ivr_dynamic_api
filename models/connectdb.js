const moment = require('moment');
moment.locale('th');

var mssql = require('mssql')
const config = {
    user: 'ui_user',
    password: 'Terr@b!tP@ssw0rd',
    server: '172.18.10.16',
    database: 'IVR_DYNAMIC',
    options: {
        encrypt: true // Use this if you're on Windows Azure
    }
}
module.exports = {
    connect: function () {
        mssql.connect(config, function (err) {
            console.log(moment().format('DD/MM/YYYY HH:mm:ss') + " - connected ");
            if (err) console.log(moment().format('DD/MM/YYYY HH:mm:ss') + " - Error : " + err);
        })
    },
    query: function (sql, callback) {
        mssql.query(sql, function (err, result, fields) {
            if (err) {
                console.log(moment().format('DD/MM/YYYY HH:mm:ss') + " - Error : " + err);
                callback(err);
            }
            else {
                callback(result.recordsets[0]);
            }
        });
    },
    disconnect: function () {
        mssql.close();
    }

}