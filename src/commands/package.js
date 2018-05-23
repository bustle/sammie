const { execSync } = require('child_process')
const { extname } = require('path')
const { readFileSync } = require('fs')
const yaml = require('js-yaml')
const { logInfo, logCommand, logSuccess } = require('../log')
const { findTemplatePath, spawnAsync } = require('../utils')

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
  const templateString = readFileSync(templatePath, 'utf8')
  const templateJson = useJson ? JSON.parse(templateString) : yaml.safeLoad(templateString)
  const bucketName = templateJson.Parameters.bucketName.Default
  const command =
    `aws cloudformation package ` +
    `--template-file ${templatePath} ` +
    `--output-template-file ${templatePathPackaged} ` +
    `--s3-bucket ${bucketName} ` +
    `${useJson ? '--use-json' : ''}`

  checkCliVersion()
  await createS3Bucket(bucketName)
  logInfo('Packaging and uploading code...')
  logCommand(command)
  await spawnAsync(command)
  logSuccess('Code packaged & uploaded')
  return { templateJson, templatePathPackaged }
}

module.exports = packageProject
