const { extname } = require('path')
const { readFileSync } = require('fs')
const { execSync } = require('child_process')
const { spawnAsync, delteFileAsync } = require('./utils')
const { logInfo, logCommand, logSuccess } = require('./log')
const validate = require('./validate')
const yaml = require('js-yaml')

function checkCliVersion() {
  const output = execSync('aws cloudformation package help')
  if (!/--use-json/.test(output)) throw Error('Please upgrade aws cli to the latest version')
}

async function packageProject(templatePath, templatePathPkg, bucketName, useJson) {
  checkCliVersion()
  const command =
    `aws cloudformation package ` +
    `--template-file ${templatePath} ` +
    `--output-template-file ${templatePathPkg} ` +
    `--s3-bucket ${bucketName} ` +
    `${useJson ? '--use-json' : ''}`
  logInfo('Packaging and uploading code...')
  logCommand(command)
  return spawnAsync(command)
}

async function deployStack(templatePathPkg, stackName, parameters) {
  const parametersFlag = parameters && parameters.length && parameters.join(' ')
  const command =
    `aws cloudformation deploy ` +
    `--template-file ${templatePathPkg} ` +
    `--stack-name ${stackName} ` +
    `--capabilities CAPABILITY_IAM ` +
    `${parametersFlag ? '--parameter-overrides ' + parametersFlag : ''}`
  logInfo(`Deploying stack: "${stackName}"...`)
  logCommand(command)
  return spawnAsync(command)
}

async function createS3Bucket(bucketName) {
  logInfo('Creating s3 code bucket (if necessary)...')
  const command = `aws s3api create-bucket --bucket ${bucketName}`
  logCommand(command)
  const data = await spawnAsync(command)
  const bucketLocation = data.Location
  if (!bucketLocation) throw Error('Bucket could not be created')
  return bucketLocation
}

async function getStackOutputs(stackName) {
  const command = `aws cloudformation describe-stacks --stack-name ${stackName}`
  const data = await spawnAsync(command)
  const outputs = data.Stacks[0].Outputs.reduce((result, o) => {
    result[o.OutputKey] = o.OutputValue
    return result
  }, {})
  return outputs
}

async function getEndpointUrl(stackName) {
  const { apiId, region, environment } = await getStackOutputs(stackName)
  if (apiId && region && environment) {
    return `https://${apiId}.execute-api.${region}.amazonaws.com/${environment}`
  }
}

async function deploy(input) {
  const templatePath = await validate(input)
  const templateExt = extname(templatePath)
  const useJson = templateExt === '.json'
  const templateString = readFileSync(templatePath, 'utf8')
  const templateJson = useJson ? JSON.parse(templateString) : yaml.safeLoad(templateString)
  const templatePathPkg = templatePath.replace(new RegExp(templateExt + '$'), '-packaged' + templateExt)
  const templateParams = templateJson.Parameters
  const bucketName = templateParams.bucketName.Default
  const environment =
    input.environment || (templateParams.environment && templateParams.environment.Default) || 'development'
  const stackName = `${templateParams.stackName.Default}-${environment}`
  const deployParams = [].concat(input.parameters || [], `environment=${environment}`)
  await createS3Bucket(bucketName)
  await packageProject(templatePath, templatePathPkg, bucketName, useJson)
  await deployStack(templatePathPkg, stackName, deployParams)
  delteFileAsync(templatePathPkg)
  const url = await getEndpointUrl(stackName)
  logSuccess('Deploy success')
  logInfo('Live url:', url)
}

module.exports = deploy
