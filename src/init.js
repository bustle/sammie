const AWS = require('aws-sdk')
const yaml = require('js-yaml')
const { pascalCaseString, writeFileAsync, log } = require('./utils')
const samTemplate = require('./templates/sam-template')
const lambdaTemplate = require('./templates/lambda-template')

async function getAccountId() {
  const sts = new AWS.STS()
  const data = await sts.getCallerIdentity().promise()
  return data.Account
}

async function makeSam(name, opts) {
  const accountId = await getAccountId()
  const template = JSON.parse(JSON.stringify(samTemplate))
  const { Resources, Parameters } = template
  const resourceName = pascalCaseString(name) + 'Function'
  const resource = (Resources[resourceName] = Resources.__RESOURCE_NAME__)
  resource.Properties.FunctionName = name
  Parameters.BucketName.Default = `sam-uploads-${accountId}`
  Parameters.StackName.Default = `${name}-stack`
  delete Resources.__RESOURCE_NAME__

  const useYaml = opts.yaml
  const path = `sam.${useYaml ? 'yaml' : 'json'}`
  const content = useYaml ? yaml.safeDump(template) : JSON.stringify(template, null, 2) + '\n'
  await writeFileAsync(path, content)
  return path
}

async function makeLambda(name) {
  const path = 'index.js'
  const func = lambdaTemplate.replace(/__NAME__/g, name)
  await writeFileAsync(path, func)
  return path
}

async function init(name, opts) {
  const sam = makeSam(name, opts)
  const lambda = makeLambda(name)
  const files = [await sam, await lambda]
  log('created files:\n', files.join(' \n '))
}

module.exports = init
