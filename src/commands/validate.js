const { findTemplatePath, spawnAsync } = require('../utils')
const { logInfo, logCommand, logSuccess } = require('../log')

async function validate(input) {
  const templatePath = findTemplatePath(input)
  const command = `aws cloudformation validate-template --template-body file://${templatePath}`
  logInfo(`Validating template...`)
  logCommand(command)
  await spawnAsync(command)
  logSuccess('Template valid')
}

module.exports = validate
