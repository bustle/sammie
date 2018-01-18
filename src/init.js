const AWS = require('aws-sdk')
const yaml = require('js-yaml')
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

async function makeSamTemplate(name, opts) {
  const accountId = await getAccountId()
  const template = JSON.parse(JSON.stringify(samTemplate))
  const { Resources, Parameters } = template
  const resourceName = `${name.charAt(0).toUpperCase() + name.slice(1).replace(/[\W_]+/g, '')}Function`
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
  return Promise.all([makeSamTemplate(name, opts), makeLambda(name)])
    .then(files => console.log('[sammie] created files:\n', files.join(' \n '))) // eslint-disable-line no-console
    .catch(e => console.log(e.message)) // eslint-disable-line no-console
}

module.exports = init
