const sade = require('sade')
const pkg = require('../package')
const init = require('./init')
const deploy = require('./deploy')
const validate = require('./validate')

process.on('unhandledRejection', e => {
  throw e
})

const cli = sade(pkg.name)

cli.version(pkg.version)

cli
  .command('init <name>')
  .describe('Initialize a project with a <name>')
  .option('-y, --yaml', 'Generate yaml for SAM template. Defaults to json, because javascript.')
  .example('init my-app')
  .action(init)

cli
  .command('deploy')
  .describe('Deploy a SAM project')
  .option('-t, --template', 'Path to a SAM template. Defaults to `sam.(json|yaml)` in the current directory.')
  .option('-e, --environment', 'An environment name to deploy. Defaults to "development".')
  .option('-p, --parameters', 'A list of parameters to override in your template.')
  .example('deploy')
  .example('deploy --template ./configs/sam.json --environment production --parameters key1=val1 key2=val2')
  .action(deploy)

cli
  .command('validate')
  .describe('Validate a SAM template')
  .option('-t, --template', 'Path to a SAM template. Defaults to `sam.(json|yaml)` in the current directory')
  .example('validate')
  .example('validate --template ./config/sam.json')
  .action(validate)

module.exports = cli
