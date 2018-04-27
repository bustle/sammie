const template = (event, context) => {
  return Promise.resolve({
    body: 'Hello __NAME__!',
    statusCode: 200
  })
}

module.exports = 'exports.handler = ' + template.toString() + '\n'
