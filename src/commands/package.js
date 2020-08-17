const { execSync } = require('child_process')
const { basename, extname, dirname, join } = require('path')
const yaml = require('js-yaml')
const deepmerge = require('deepmerge')
const log = require('../log')
const { findTemplatePath, spawnAsync, readFileAsync, writeFileAsync, deleteFileAsync } = require('../utils')

// Older versions of aws cli don't support json for `aws cloudformation package`
function checkCliVersion() {
  const output = execSync('aws cloudformation package help')
  if (!/--use-json/.test(output)) throw Error('Please upgrade aws cli to the latest version')
}

function parseTemplate(templateString, templateExt) {
  const useJson = templateExt === '.json'
  return useJson ? JSON.parse(templateString) : yaml.safeLoad(templateString)
}

function serializeTemplate(templateJson, templateExt) {
  const useJson = templateExt === '.json'
  return useJson ? JSON.stringify(templateJson, null, 2) : yaml.safeDump(templateJson)
}

function filePathWithSuffix(filePath, suffix) {
  const fileExt = extname(filePath)
  const fileWithoutExt = basename(filePath, fileExt)
  return join(dirname(filePath), fileWithoutExt + suffix + fileExt)
}

async function createS3Bucket(bucketName) {
  const command = `aws s3api head-bucket --bucket ${bucketName} &>/dev/null || aws s3 mb s3://${bucketName}`
  log.info('Creating s3 code bucket (if necessary)...').command(command)
  return spawnAsync(command)
}

async function mergeEnvTemplate(baseTemplatePath, baseTemplateJson, environment) {
  const templateExt = extname(baseTemplatePath)
  const environmentTemplatePath = filePathWithSuffix(baseTemplatePath, `-${environment}`)
  let enviromentTemplateString
  try {
    enviromentTemplateString = await readFileAsync(environmentTemplatePath, 'utf8')
  } catch (e) {
    return []
  }
  log.info(`Merging ${environment} template (${environmentTemplatePath}) with base template (${baseTemplatePath})`)
  const enviromentTemplateJson = parseTemplate(enviromentTemplateString, templateExt)
  const mergedTemplateJson = deepmerge(baseTemplateJson, enviromentTemplateJson)
  const mergedTemplateString = serializeTemplate(mergedTemplateJson, templateExt)
  const mergedTemplatePath = filePathWithSuffix(baseTemplatePath, `-${environment}-merged`)
  await writeFileAsync(mergedTemplatePath, mergedTemplateString)
  return [mergedTemplatePath, mergedTemplateJson]
}

module.exports = async function packageProject(input) {
  const templatePath = findTemplatePath(input)
  const templateString = await readFileAsync(templatePath, 'utf8')
  const templateExt = extname(templatePath)
  const templateJson = parseTemplate(templateString, templateExt)
  const environment = input.environment || 'development'
  const [templatePathEnvMerged, templateJsonEnvMerged] = await mergeEnvTemplate(templatePath, templateJson, environment)
  const resolvedTemplatePath = templatePathEnvMerged || templatePath
  const resolvedTemplateJson = templateJsonEnvMerged || templateJson
  const templatePathPackaged = filePathWithSuffix(templatePath, '-packaged')
  const parameters = resolvedTemplateJson.Parameters
  const stackName = input['stack-name'] || `${parameters.stackName && parameters.stackName.Default}-${environment}`
  const bucketName = input['s3-bucket'] || (parameters.bucketName && parameters.bucketName.Default)
  const s3Prefix =
    input['s3-prefix'] ||
    (parameters.s3Prefix && parameters.s3Prefix.Default) ||
    `${stackName}/${new Date().getFullYear()}`
  const command =
    `aws cloudformation package ` +
    `--template-file ${resolvedTemplatePath} ` +
    `--output-template-file ${templatePathPackaged} ` +
    `--s3-bucket ${bucketName}` +
    `${s3Prefix ? ' --s3-prefix ' + s3Prefix : ''}` +
    `${templateExt === '.json' ? ' --use-json' : ''}`

  checkCliVersion()
  await createS3Bucket(bucketName)
  log.info('Packaging and uploading code...').command(command)
  await spawnAsync(command)
  if (templatePathEnvMerged) await deleteFileAsync(templatePathEnvMerged)
  log.success('Code packaged & uploaded')
  return { templatePathPackaged, environment, stackName, bucketName }
}
