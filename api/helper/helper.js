const ivr = require("../../models/connect_ivr");
module.exports = {
  alertToast: function (title, description, variant) {
    const data = {
      title: title,
      description: description,
      variant: variant
    }
    return data;
  },
  checkAILastId: function (table, column, callback) {
    let sql = `SELECT TOP(1) ${column} FROM ${table} ORDER BY ${column} DESC;`;
    ivr.query(sql, function (response) {
      if (response.length) {
        if (callback) {
          var item = response[0]
          callback(item[column] + 1)
        }
      } else {
        callback(1)
      }
    })
  },
  checkUsedObj: function (id, callback) {
    let sql = `EXEC spCheckDelete '${id}'`
    ivr.query(sql, function (response) {
      callback(response)
    })
  }
}