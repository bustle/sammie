const { execSync } = require('child_process')
const { basename, extname, dirname, join } = require('path')
const yaml = require('js-yaml')
const deepmerge = require('deepmerge')
const log = require('../log')
const { findTemplatePath, spawnAsync, readFileAsync, writeFileAsync } = require('../utils')

// Older versions of aws cli don't support json for `aws cloudformation package`
function checkCliVersion() {
  const output = execSync('aws cloudformation package help')
  if (!/--use-json/.test(output)) throw Error('Please upgrade aws cli to the latest version')
}

function parseTemplate(templateString, templateExt) {
  const useJson = templateExt === '.json'
  return useJson ? JSON.parse(templateString) : yaml.safeLoad(templateString)
}

function filePathWithSuffix(filePath, suffix) {
  const fileExt = extname(filePath)
  const fileWithoutExt = basename(filePath, fileExt)
  return join(dirname(filePath), fileWithoutExt + suffix + fileExt)
}

async function createS3Bucket(bucketName) {
  const command = `aws s3api create-bucket --bucket ${bucketName}`
  log.info('Creating s3 code bucket (if necessary)...').command(command)
  const data = await spawnAsync(command)
  const bucketLocation = data.Location
  if (!bucketLocation) throw Error('Bucket could not be created')
  return bucketLocation
}

async function mergeEnvTemplate(baseTemplatePath, baseTemplateJson, environment) {
  const environmentTemplatePath = filePathWithSuffix(baseTemplatePath, `-${environment}`)
  let enviromentTemplateString
  try {
    enviromentTemplateString = await readFileAsync(environmentTemplatePath, 'utf8')
  } catch (e) {
    return
  }
  log.info(`Merging ${environment} template (${environmentTemplatePath}) with base template (${baseTemplatePath})`)
  const enviromentTemplateJson = parseTemplate(enviromentTemplateString, extname(baseTemplatePath))
  const mergedTemplateJson = deepmerge(baseTemplateJson, enviromentTemplateJson)
  const mergedTemplatePath = filePathWithSuffix(baseTemplatePath, `-${environment}-merged`)
  await writeFileAsync(mergedTemplatePath, JSON.stringify(mergedTemplateJson, null, 2))
  return mergedTemplatePath
}

module.exports = async function packageProject(input) {
  const templatePath = findTemplatePath(input)
  const templateString = await readFileAsync(templatePath, 'utf8')
  const templateExt = extname(templatePath)
  const templateJson = parseTemplate(templateString, templateExt)
  const parameters = templateJson.Parameters
  const environment = input.environment || (parameters.environment && parameters.environment.Default) || 'development'
  const templatePathEnvMerged = await mergeEnvTemplate(templatePath, templateJson, environment)
  const templatePathPackaged = filePathWithSuffix(templatePath, '-packaged')
  const bucketName = parameters.bucketName.Default
  const command =
    `aws cloudformation package ` +
    `--template-file ${templatePathEnvMerged || templatePath} ` +
    `--output-template-file ${templatePathPackaged} ` +
    `--s3-bucket ${bucketName} ` +
    `${templateExt === '.json' ? '--use-json' : ''}`

  checkCliVersion()
  await createS3Bucket(bucketName)
  log.info('Packaging and uploading code...').command(command)
  await spawnAsync(command)
  log.success('Code packaged & uploaded')
  return { templatePathEnvMerged, templatePathPackaged, environment, parameters }
}
