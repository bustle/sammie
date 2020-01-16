const validate = require('./validate')
const packageProject = require('./package')
const log = require('../log')
const { spawnAsync, deleteFileAsync } = require('../utils')

async function deployStack(templatePathPackaged, stackName, capabilities, parameters) {
  const parametersFlag = parameters && parameters.length && parameters.join(' ')
  const command =
    `aws cloudformation deploy ` +
    `--template-file ${templatePathPackaged} ` +
    `--stack-name ${stackName} ` +
    `--capabilities ${capabilities || 'CAPABILITY_IAM'} ` +
    `${parametersFlag ? '--parameter-overrides ' + parametersFlag : ''}`
  log.info(`Deploying stack "${stackName}"...`).command(command)
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

async function cleanPackagedTemplates(paths) {
  return Promise.all(paths.filter(Boolean).map(path => deleteFileAsync(path)))
}

module.exports = async function deploy(input) {
  await validate(input)
  const { templatePathEnvMerged, templatePathPackaged, environment, stackName } = await packageProject(input)
  const deployParams = [].concat(input.parameters || [], `environment=${environment}`)
  try {
    await deployStack(templatePathPackaged, stackName, input.capabilities, deployParams)
  } finally {
    await cleanPackagedTemplates([templatePathPackaged, templatePathEnvMerged])
  }
  log.success('Deployed')
  const outputs = await getStackOutputs(stackName)
  const url =
    outputs.apiUrl || `https://${outputs.apiId}.execute-api.${outputs.region}.amazonaws.com/${outputs.environment}`
  log.info('Live url:', url)
}
