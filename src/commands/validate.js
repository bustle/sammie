const { findTemplatePath, spawnAsync } = require('../utils')
const log = require('../log')

module.exports = async function validate(input) {
  const templatePath = findTemplatePath(input)
  const command = `aws cloudformation validate-template --template-body file://${templatePath}`
  log.info(`Validating template...`).command(command)
  await spawnAsync(command)
  log.success('Template valid')
}
