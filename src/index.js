const sade = require('sade')
const pkg = require('../package')
const init = require('./init')
const deploy = require('./deploy')

const cli = sade(pkg.name)

cli.version(pkg.version)

cli
  .command('init <name>')
  .describe('Initialize a SAM project with a project <name>')
  .action(init)

cli
  .command('deploy')
  .describe('Deploy a SAM project')
  .option('-t, --template', 'Path to the SAM template. Defaults to `sam.json` in the current directory.')
  .action(deploy)

module.exports = cli
