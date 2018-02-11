const AWS = require('aws-sdk')
const yaml = require('js-yaml')
const { extname } = require('path')
const { loadTemplate, spawnAsync, delteFileAsync, log } = require('./utils')
const validate = require('./validate')

// TODO: Use the nodejs SDK instead of `cloudformation package`, `cloudformation deploy`
// https://github.com/gpoitch/sammie/issues/1

async function packageProject(templatePath, templatePathPkg, bucketName, useJson) {
  const command =
    `aws cloudformation package ` +
    `--template-file ${templatePath} ` +
    `--output-template-file ${templatePathPkg} ` +
    `--s3-bucket ${bucketName} ` +
    `${useJson ? '--use-json' : ''}`

  log('Packaging\n', templatePath, '=>', templatePathPkg)
  log('Uploading\n', `s3://${bucketName}`)
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

  log('Deploying\n', `stack: ${stackName}`, parametersFlag ? `\n parameters: ${parametersFlag}` : '')
  return spawnAsync(command)
}

async function createS3Bucket(bucketName) {
  return new AWS.S3().createBucket({ Bucket: bucketName }).promise()
}

async function getStackOutputs(stackName) {
  const cloudformation = new AWS.CloudFormation()
  const data = await cloudformation.describeStacks({ StackName: stackName }).promise()
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
  if (!await validate(input)) return
  const { templatePath, templateString } = loadTemplate(input)
  const templateExt = extname(templatePath)
  const useJson = templateExt === '.json'
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
  log('Deploy success ✔︎', url ? `\n ${url}` : '')
}

module.exports = deploy
