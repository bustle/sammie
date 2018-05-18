const { findTemplatePath, spawnAsync, logInfo, logCommand, checkmark } = require('./utils')

async function validate(input) {
  const templatePath = findTemplatePath(input)
  const command = `aws cloudformation validate-template --template-body file://${templatePath}`
  logInfo(`Validating template...`)
  logCommand(command)
  await spawnAsync(command)
  logInfo('Template valid', checkmark)
  return templatePath
}

module.exports = validate
