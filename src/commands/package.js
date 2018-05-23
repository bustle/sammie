const { execSync } = require('child_process')
const { extname } = require('path')
const yaml = require('js-yaml')
const deepmerge = require('deepmerge')
const { logInfo, logCommand, logSuccess } = require('../log')
const { findTemplatePath, spawnAsync, readFileAsync, writeFileAsync, deleteFileAsync } = require('../utils')

// Older versions of aws cli don't support json for `aws cloudformation package`
function checkCliVersion() {
  const output = execSync('aws cloudformation package help')
  if (!/--use-json/.test(output)) throw Error('Please upgrade aws cli to the latest version')
}

async function createS3Bucket(bucketName) {
  logInfo('Creating s3 code bucket (if necessary)...')
  const command = `aws s3api create-bucket --bucket ${bucketName}`
  logCommand(command)
  const data = await spawnAsync(command)
  const bucketLocation = data.Location
  if (!bucketLocation) throw Error('Bucket could not be created')
  return bucketLocation
}

async function packageProject(input) {
  const templatePath = findTemplatePath(input)
  const templateExt = extname(templatePath)
  const useJson = templateExt === '.json'
  const templatePathPackaged = templatePath.replace(new RegExp(templateExt + '$'), '-packaged' + templateExt)
  const templateString = await readFileAsync(templatePath, 'utf8')
  const templateJson = useJson ? JSON.parse(templateString) : yaml.safeLoad(templateString)
  const parameters = templateJson.Parameters
  const bucketName = parameters.bucketName.Default
  const environment = input.environment || (parameters.environment && parameters.environment.Default) || 'development'
  const environmentTemplatePath = templatePath.replace(templateExt, `-${environment}${templateExt}`)
  let enviromentTemplateString
  try {
    enviromentTemplateString = await readFileAsync(environmentTemplatePath, 'utf8')
  } catch (e) {}

  let templatePathToPackage = templatePath
  if (enviromentTemplateString) {
    logInfo(`Combining ${environment} template (${environmentTemplatePath}) into base template (${templatePath})`)
    const enviromentTemplateJson = useJson
      ? JSON.parse(enviromentTemplateString)
      : yaml.safeLoad(enviromentTemplateString)
    const combinedTemplateJson = deepmerge(templateJson, enviromentTemplateJson)
    const combinedTemplatePath = templatePath.replace(templateExt, `-${environment}-${Date.now()}${templateExt}`)
    await writeFileAsync(combinedTemplatePath, JSON.stringify(combinedTemplateJson, null, 2), { flag: 'wx' })
    templatePathToPackage = combinedTemplatePath
  }

  const command =
    `aws cloudformation package ` +
    `--template-file ${templatePathToPackage} ` +
    `--output-template-file ${templatePathPackaged} ` +
    `--s3-bucket ${bucketName} ` +
    `${useJson ? '--use-json' : ''}`

  checkCliVersion()
  await createS3Bucket(bucketName)
  logInfo('Packaging and uploading code...')
  logCommand(command)
  await spawnAsync(command)
  logSuccess('Code packaged & uploaded')
  if (enviromentTemplateString) deleteFileAsync(templatePathToPackage)
  return { templateJson, templatePathPackaged }
}

module.exports = packageProject
