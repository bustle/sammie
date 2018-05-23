const validate = require('./validate')
const packageProject = require('./package')
const { spawnAsync, deleteFileAsync } = require('../utils')
const { logInfo, logCommand, logSuccess } = require('../log')

async function deployStack(templatePathPackaged, stackName, parameters) {
  const parametersFlag = parameters && parameters.length && parameters.join(' ')
  const command =
    `aws cloudformation deploy ` +
    `--template-file ${templatePathPackaged} ` +
    `--stack-name ${stackName} ` +
    `--capabilities CAPABILITY_IAM ` +
    `${parametersFlag ? '--parameter-overrides ' + parametersFlag : ''}`
  logInfo(`Deploying stack: "${stackName}"...`)
  logCommand(command)
  return spawnAsync(command)
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
  return apiId && region && environment && `https://${apiId}.execute-api.${region}.amazonaws.com/${environment}`
}

async function deploy(input) {
  await validate(input)
  const { templateJson, templatePathPackaged } = await packageProject(input)
  const { environment: jsonEnvironment, stackName: jsonStackName } = templateJson.Parameters
  const environment = input.environment || (jsonEnvironment && jsonEnvironment.Default) || 'development'
  const stackName = `${jsonStackName.Default}-${environment}`
  const deployParams = [].concat(input.parameters || [], `environment=${environment}`)
  await deployStack(templatePathPackaged, stackName, deployParams)
  logSuccess('Deployed')
  deleteFileAsync(templatePathPackaged)
  const url = await getEndpointUrl(stackName)
  logInfo('Live url:', url)
}

module.exports = deploy
