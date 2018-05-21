const yaml = require('js-yaml')
const { resourceSafeName, stackSafeName, writeFileAsync, spawnAsync } = require('./utils')
const { logInfo, logSuccess, logCommand } = require('./log')
const samTemplate = require('./templates/sam-template')
const lambdaTemplate = require('./templates/lambda-template')

async function getAccountId() {
  logInfo('Getting AWS account id...')
  const command = `aws sts get-caller-identity`
  logCommand(command)
  const data = await spawnAsync(command)
  const accountId = data.Account
  if (!accountId) throw Error('Could not get AWS account id')
  logSuccess('Account id:', accountId)
  return accountId
}

async function makeSamTemplate(name, opts) {
  const accountId = await getAccountId()
  const useYaml = opts.yaml
  const path = `sam.${useYaml ? 'yaml' : 'json'}`
  const templateString = JSON.stringify(samTemplate).replace(/__NAME__/g, resourceSafeName(name))
  const template = JSON.parse(templateString)
  template.Parameters.bucketName.Default = `sam-uploads-${accountId}`
  template.Parameters.stackName.Default = name
  const content = useYaml ? yaml.safeDump(template) : JSON.stringify(template, null, 2) + '\n'
  await writeFileAsync(path, content, { flag: 'wx' })
  return path
}

async function makeLambdaFunction(name) {
  const path = 'index.js'
  const func = lambdaTemplate.replace(/__NAME__/g, name)
  await writeFileAsync(path, func, { flag: 'wx' })
  return path
}

async function init(name, opts) {
  const stackName = stackSafeName(name)
  const templatePath = await makeSamTemplate(stackName, opts)
  const codePath = await makeLambdaFunction(stackName)
  logSuccess(`Created project: "${stackName}"`)
  logInfo('template:', templatePath, '| code:', codePath)
}

module.exports = init
