const { readFileSync } = require('fs')
const { join, extname } = require('path')
const AWS = require('aws-sdk')
const yaml = require('js-yaml')
const { spawnAsync, delteFileAsync, log } = require('./utils')

// TODO: Use the nodejs SDK instead of `cloudformation package`, `cloudformation deploy`
// https://github.com/gpoitch/sammie/issues/1

async function packageProject(templatePath, templatePathPkg, s3BucketName, useJson) {
  log('packaging:', templatePath)
  return spawnAsync(
    `aws cloudformation package ` +
      `--template-file ${templatePath} ` +
      `--output-template-file ${templatePathPkg} ` +
      `--s3-bucket ${s3BucketName} ` +
      `${useJson ? '--use-json' : ''}`
  )
}

async function deployStack(templatePathPkg, stackName, parameters) {
  log('deploying:', stackName)
  return spawnAsync(
    `aws cloudformation deploy ` +
      `--template-file ${templatePathPkg} ` +
      `--stack-name ${stackName} ` +
      `--capabilities CAPABILITY_IAM ` +
      `${parameters ? '--parameter-overrides ' + parameters.join(' ') : ''}`
  )
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

async function launchProject(stackName) {
  const { ApiId, Region, Stage } = await getStackOutputs(stackName)
  if (ApiId && Region && Stage) {
    const apiUrl = `https://${ApiId}.execute-api.${Region}.amazonaws.com/${Stage}`
    spawnAsync(`open ${apiUrl}`)
  }
}

async function deploy(input) {
  const templatePath = join(process.cwd(), input.template || 'sam.json')
  const templateExt = extname(templatePath)
  const templatePathPkg = templatePath.replace(new RegExp(templateExt + '$'), '-packaged' + templateExt)
  const useJson = templateExt === '.json'
  const template = useJson ? require(templatePath) : yaml.safeLoad(readFileSync(templatePath, 'utf8'))
  const s3BucketName = template.Parameters.BucketName.Default
  const stackName = template.Parameters.StackName.Default
  await createS3Bucket(s3BucketName)
  await packageProject(templatePath, templatePathPkg, s3BucketName, useJson)
  await deployStack(templatePathPkg, stackName, input.parameters)
  delteFileAsync(templatePathPkg)
  launchProject(stackName)
}

module.exports = deploy
