const sade = require('sade')
const pkg = require('../package')
const init = require('./init')
const deploy = require('./deploy')
const validate = require('./validate')

process.env.AWS_SDK_LOAD_CONFIG = true
process.on('unhandledRejection', e => {
  throw e
})

const cli = sade(pkg.name)

cli.version(pkg.version)

cli
  .command('init <name>')
  .describe('Initialize a SAM project with a project <name>')
  .option('-y, --yaml', 'Generate yaml for SAM template. Defaults to json, because javascript.')
  .example('init myapp')
  .action(init)

cli
  .command('deploy')
  .describe('Deploy a SAM project')
  .option('-t, --template', 'Path to the SAM template. Defaults to `sam.json` in the current directory.')
  .option('-e, --environment', 'An environment name to deploy. Defaults to development.')
  .option('-p, --parameters', 'A list of parameters to override in your template.')
  .example('deploy')
  .example('deploy --template ./config/template.json --environment production --parameters foo=bar')
  .action(deploy)

cli
  .command('validate')
  .describe('Validate a SAM template')
  .option('-t, --template', 'Path to the SAM template. Defaults to `sam.json` in the current directory.')
  .example('validate')
  .example('validate --template ./config/template.json')
  .action(validate)

module.exports = cli
