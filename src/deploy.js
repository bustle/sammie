const AWS = require('aws-sdk')
const yaml = require('js-yaml')
const spawnAsync = require('./spawn-async')
const { spawn } = require('child_process')
const { readFileSync, unlink } = require('fs')
const { join, extname } = require('path')
const { promisify } = require('util')
const delteFileAsync = promisify(unlink)

// TODO: Ideally use the AWS node SDK but `cloudformation package` and `cloudformation deploy`
// are complex custom commands only available in the AWS CLI.

async function cloudformationPackage(templateFile, templateFilePackaged, useJson, s3BucketName) {
  return spawnAsync(
    `aws cloudformation package --template-file ${templateFile} --output-template-file ${templateFilePackaged} --s3-bucket ${s3BucketName} ${
      useJson ? '--use-json' : ''
    }`
  )
}

async function cloudformationDeploy(templateFilePackaged, stackName) {
  return spawnAsync(
    `aws cloudformation deploy --template-file ${templateFilePackaged} --stack-name ${stackName} --capabilities CAPABILITY_IAM`
  )
}

async function createS3Bucket(bucketName) {
  return new AWS.S3().createBucket({ Bucket: bucketName }).promise()
}

async function getApiUrl(stackName, region = 'us-east-1', stage = 'Prod') {
  const cloudformation = new AWS.CloudFormation({ region })
  const restApiResource = await cloudformation
    .describeStackResource({ LogicalResourceId: 'ServerlessRestApi', StackName: stackName })
    .promise()
  return `https://${
    restApiResource.StackResourceDetail.PhysicalResourceId
  }.execute-api.${region}.amazonaws.com/${stage}`
}

async function deploy(input) {
  const templateFile = join(process.cwd(), input.template || 'sam.json')
  const templateExtension = extname(templateFile)
  const useJson = templateExtension === '.json'
  const templateFilePackaged = templateFile.replace(
    new RegExp(templateExtension + '$', 'i'),
    '-packaged' + templateExtension
  )
  const template = useJson ? require(templateFile) : yaml.safeLoad(readFileSync(templateFile, 'utf8'))
  const { Parameters } = template
  const s3BucketName = Parameters.BucketName.Default
  const stackName = Parameters.StackName.Default
  try {
    await createS3Bucket(s3BucketName)
    await cloudformationPackage(templateFile, templateFilePackaged, useJson, s3BucketName)
    await cloudformationDeploy(templateFilePackaged, stackName)
    delteFileAsync(templateFilePackaged)
    const apiUrl = await getApiUrl(stackName)
    spawn('open', [apiUrl])
  } catch (e) {
    console.log(e.message) // eslint-disable-line no-console
  }
}

module.exports = deploy