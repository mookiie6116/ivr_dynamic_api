module.exports = {
  alertToast: function (title, description,variant) {
    const data = {
      title: title,
      description: description,
      variant: variant
    }
    return data;
  },

}