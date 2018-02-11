const AWS = require('aws-sdk')
const { loadTemplate, log } = require('./utils')

async function validate(input) {
  const { templatePath, templateString } = loadTemplate(input)
  await new AWS.CloudFormation().validateTemplate({ TemplateBody: templateString }).promise()
  log(`Valid template ✔︎\n`, templatePath)
  return true
}

module.exports = validate
