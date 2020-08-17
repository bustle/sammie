const { join } = require('path')
const { statSync } = require('fs')
const validate = require('./validate')
const packageProject = require('./package')
const log = require('../log')
const { spawnAsync, deleteFileAsync } = require('../utils')

async function deployStack(templatePathPackaged, stackName, bucketName, capabilities, parameters) {
  const parametersFlag = parameters && parameters.length && parameters.join(' ')
  const templateStats = statSync(join(process.cwd(), templatePathPackaged))
  const command =
    `aws cloudformation deploy ` +
    `--template-file ${templatePathPackaged} ` +
    `--stack-name ${stackName} ` +
    `--capabilities ${capabilities || 'CAPABILITY_IAM'} ` +
    `${templateStats.size > 51200 ? '--s3-bucket ' + bucketName : ''} ` +
    `${parametersFlag ? '--parameter-overrides ' + parametersFlag : ''}`
  log.info(`Deploying stack "${stackName}"...`).command(command)
  return spawnAsync(command)
}

async function getApiUrl(stackName) {
  const { StackResources } = await spawnAsync(`aws cloudformation describe-stack-resources --stack-name ${stackName}`)
  const apiInfo = StackResources && StackResources.find(({ ResourceType }) => ResourceType === 'AWS::ApiGatewayV2::Api')
  const apiId = apiInfo && apiInfo.PhysicalResourceId
  const region = apiInfo.StackId.split(':')[3]
  return apiId && region && `https://${apiId}.execute-api.${region}.amazonaws.com`
}

module.exports = async function deploy(input) {
  await validate(input)

  const packageResults = await packageProject(input)
  const { templatePathPackaged, environment, stackName, bucketName } = packageResults

  const deployParams = [].concat(input.parameters || [], `environment=${environment}`)
  try {
    await deployStack(templatePathPackaged, stackName, bucketName, input.capabilities, deployParams)
    log.success('Deployed')
  } finally {
    deleteFileAsync(templatePathPackaged)
  }

  try {
    const apiUrl = await getApiUrl(stackName)
    if (apiUrl) log.info('Live url:', apiUrl)
  } catch {}
}
