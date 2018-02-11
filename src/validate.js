const AWS = require('aws-sdk')
const { readFileSync } = require('fs')
const { join } = require('path')
const { log } = require('./utils')

async function validate(input) {
  const templatePath = join(process.cwd(), input.template || 'sam.json')
  const body = readFileSync(templatePath, 'utf8')
  await new AWS.CloudFormation().validateTemplate({ TemplateBody: body }).promise()
  log('Template valid ✔︎\n', templatePath)
  return true
}

module.exports = validate
