const yaml = require('js-yaml')
const { writeFileAsync, spawnAsync } = require('../utils')
const log = require('../log')
const samTemplate = require('../templates/sam')
const lambdaTemplate = require('../templates/lambda')

async function getAccountId() {
  const command = `aws sts get-caller-identity`
  log.info('Getting AWS account id...').command(command)
  const data = await spawnAsync(command)
  const accountId = data.Account
  if (!accountId) throw Error('Could not get AWS account id')
  log.success('Account id:', accountId)
  return accountId
}

function stackSafeName(string) {
  return string.trim().replace(/[^a-z0-9]/gi, '-')
}

function resourceSafeName(string) {
  const pascaledString = string.replace(/(-|_|\.|\s)+(.)?/g, (m, s, c) => (c ? c.toUpperCase() : ''))
  return pascaledString.charAt(0).toUpperCase() + pascaledString.slice(1)
}

async function makeSamTemplate(stackName, accountId, input) {
  const useYaml = input.yaml
  const path = `sam.${useYaml ? 'yaml' : 'json'}`
  const templateString = JSON.stringify(samTemplate).replace(/__NAME__/g, resourceSafeName(stackName))
  const template = JSON.parse(templateString)
  template.Parameters.bucketName.Default = `sam-uploads-${accountId}`
  template.Parameters.stackName.Default = stackName
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

module.exports = async function init(name, input) {
  const stackName = stackSafeName(name)
  const accountId = await getAccountId()
  log.info('Creating project...')
  const templatePath = await makeSamTemplate(stackName, accountId, input)
  const codePath = await makeLambdaFunction(name)
  log.success(`Created "${stackName}":`, 'template:', templatePath, ', code:', codePath)
}
