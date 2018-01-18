const template = (event, context, callback) => {
  callback(null, {
    body: 'Hello __NAME__!',
    statusCode: 200
  })
}

module.exports = 'exports.handler = ' + template.toString() + '\n'
