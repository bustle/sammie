const sade = require('sade')
const pkg = require('../package')
const init = require('./init')
const deploy = require('./deploy')

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
  .option('-p, --parameters', 'A list of parameters to override in your template.')
  .example('deploy')
  .example('deploy --template ./config/template.json --parameters Stage=testing --parameters foo=bar')
  .action(deploy)

process.on('unhandledRejection', error => console.log('[sammie]', error)) // eslint-disable-line no-console

module.exports = cli
