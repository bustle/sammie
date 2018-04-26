const { loadTemplate, spawnAsync, logInfo, logCommand, checkmark } = require('./utils')

async function validate(input) {
  const { templatePath } = loadTemplate(input)
  const command = `aws cloudformation validate-template --template-body file://${templatePath}`
  logInfo(`Validating template...`)
  logCommand(command)
  await spawnAsync(command)
  logInfo('Template valid', checkmark)
}

module.exports = validate
