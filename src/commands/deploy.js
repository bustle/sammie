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

async function getStackOutputs(stackName) {
  const data = await spawnAsync(`aws cloudformation describe-stacks --stack-name ${stackName}`)
  const outputs = (data.Stacks[0].Outputs || []).reduce((result, o) => {
    result[o.OutputKey] = o.OutputValue
    return result
  }, {})
  return outputs
}

async function cleanPackagedTemplates(paths) {
  return Promise.all(paths.filter(Boolean).map((path) => deleteFileAsync(path)))
}

module.exports = async function deploy(input) {
  await validate(input)
  const { templatePathEnvMerged, templatePathPackaged, environment, stackName, bucketName } = await packageProject(
    input
  )
  const deployParams = [].concat(input.parameters || [], `environment=${environment}`)
  try {
    await deployStack(templatePathPackaged, stackName, bucketName, input.capabilities, deployParams)
  } finally {
    await cleanPackagedTemplates([templatePathPackaged, templatePathEnvMerged])
  }
  log.success('Deployed')
  const { apiId, region } = await getStackOutputs(stackName)
  if (apiId && region) log.info('Live url:', `https://${apiId}.execute-api.${region}.amazonaws.com`)
}
