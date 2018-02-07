const { readFileSync } = require('fs')
const { join, extname } = require('path')
const AWS = require('aws-sdk')
const yaml = require('js-yaml')
const { spawnAsync, delteFileAsync, log } = require('./utils')

// TODO: Use the nodejs SDK instead of `cloudformation package`, `cloudformation deploy`
// https://github.com/gpoitch/sammie/issues/1

async function packageProject(templatePath, templatePathPkg, bucketName, useJson) {
  const command =
    `aws cloudformation package ` +
    `--template-file ${templatePath} ` +
    `--output-template-file ${templatePathPkg} ` +
    `--s3-bucket ${bucketName} ` +
    `${useJson ? '--use-json' : ''}`

  log('Packaging:', templatePath, '-->', templatePathPkg)
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

  log('Deploying', parametersFlag ? `\n parameters: ${parametersFlag}` : '')
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
  const templatePath = join(process.cwd(), input.template || 'sam.json')
  const templateExt = extname(templatePath)
  const templatePathPkg = templatePath.replace(new RegExp(templateExt + '$'), '-packaged' + templateExt)
  const useJson = templateExt === '.json'
  const templateJson = useJson ? require(templatePath) : yaml.safeLoad(readFileSync(templatePath, 'utf8'))
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
