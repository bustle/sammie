module.exports = `exports.handler = (event, context, callback) => {
  callback(null, {
    body: 'Hello __NAME__',
    statusCode: 200
  })
}
`
