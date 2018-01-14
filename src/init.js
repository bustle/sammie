const AWS = require('aws-sdk')
const samTemplate = require('./templates/sam-template')
const lambdaTemplate = require('./templates/lambda-template')
const { promisify } = require('util')
const { writeFile } = require('fs')
const writeFileAsync = promisify(writeFile)

async function getAccountId() {
  const sts = new AWS.STS()
  const data = await sts.getCallerIdentity().promise()
  return data.Account
}

async function makeSamTemplate(name) {
  const accountId = await getAccountId()
  const template = JSON.parse(JSON.stringify(samTemplate))
  const { Resources, Parameters } = template
  const resourceName = `${name.charAt(0).toUpperCase() + name.slice(1)}Function`
  const resource = (Resources[resourceName] = Resources.__RESOURCE_NAME__)
  resource.Properties.FunctionName = name
  Parameters.BucketName.Default = `sam-uploads-${accountId}`
  Parameters.StackName.Default = `${name}-stack`
  delete Resources.__RESOURCE_NAME__

  const path = 'sam.json'
  const content = JSON.stringify(template, null, 2) + '\n'
  await writeFileAsync(path, content)
  return path
}

async function makeLambda(name) {
  const path = 'index.js'
  const func = lambdaTemplate.replace(/__NAME__/, name)
  await writeFileAsync(path, func)
  return path
}

async function init(name) {
  return Promise.all([makeSamTemplate(name), makeLambda(name)])
    .then(files => console.log('SAM files created:', ...files)) // eslint-disable-line no-console
    .catch(e => console.log(e.message)) // eslint-disable-line no-console
}

module.exports = init
