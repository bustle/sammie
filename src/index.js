const sade = require('sade')
const packageJson = require('../package')
const init = require('./commands/init')
const deploy = require('./commands/deploy')
const validate = require('./commands/validate')
const packageProject = require('./commands/package')

process.on('unhandledRejection', e => {
  console.log(e.stack) // eslint-disable-line no-console
  process.exit(e.errno || 1)
})

const cli = sade(packageJson.name)

cli.version(packageJson.version)

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
  .describe('Validate a SAM template [private - runs on `deploy`]')
  .option('-t, --template', 'Path to a SAM template. Defaults to `sam.(json|yaml)` in the current directory')
  .example('validate')
  .example('validate --template ./config/sam.json')
  .action(validate)

cli
  .command('package')
  .describe('Package & upload code [private - runs on `deploy`]')
  .option('-t, --template', 'Path to a SAM template. Defaults to `sam.(json|yaml)` in the current directory')
  .option('-e, --environment', 'An environment name to package. Defaults to "development".')
  .example('package')
  .example('package --template ./config/sam.json --environment production')
  .action(packageProject)

module.exports = cli
