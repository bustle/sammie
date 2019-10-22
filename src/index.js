const sade = require('sade')
const packageJson = require('../package')
const init = require('./commands/init')
const deploy = require('./commands/deploy')
const validate = require('./commands/validate')
const packageProject = require('./commands/package')
const { error } = require('./log')

process.on('unhandledRejection', e => {
  error(e.stack) // eslint-disable-line no-console
  process.exit(e.errno || 1)
})

const cli = sade(packageJson.name)

cli.version(packageJson.version)

cli
  .command('init <name>')
  .describe('Initialize a project with a <name>')
  .option('-y, --yaml', 'Generate yaml for SAM template. Defaults to json, because javascript')
  .example('init my-app')
  .action(init)

cli
  .command('deploy')
  .describe('Deploy a SAM project')
  .option('-t, --template', 'Path to a SAM template. Defaults to `sam.(json|yaml)` in the current directory')
  .option('-e, --environment', 'An environment name to deploy. Defaults to "development"')
  .option('-p, --parameters', 'A list of parameters to override in your template.')
  .option('-s, --stack-name', 'Option to override the auto-generated environment stack name')
  .option('--s3-bucket', 'S3 bucket where code is uploaded. Defaults to Parameters.bucketName in template')
  .option('--s3-prefix', 'S3 path prefix added to the packaged code file')
  .option('--capabilities', 'See `aws cloudformation deploy`. Defaults to CAPABILITY_IAM')
  .example('deploy')
  .example('deploy --template ./configs/sam.json --environment production --parameters key1=val1 key2=val2')
  .action(deploy)

// ---------------------------------------------------------------------
// "Private" i.e. not promoting in README to keep the project focused.
//  Still discoverable via --help
// ---------------------------------------------------------------------

cli
  .command('validate')
  .describe('[private] Validate a SAM template')
  .option('-t, --template', 'Path to a SAM template. Defaults to `sam.(json|yaml)` in the current directory')
  .example('validate')
  .example('validate --template ./config/sam.json')
  .action(validate)

cli
  .command('package')
  .describe('[private] Package & upload code')
  .option('-t, --template', 'Path to a SAM template. Defaults to `sam.(json|yaml)` in the current directory')
  .option('-e, --environment', 'An environment name to package. Defaults to "development"')
  .option('--s3-bucket', 'S3 bucket where code is uploaded. Defaults to Parameters.bucketName in template')
  .option('--s3-prefix', 'S3 path prefix added to the packaged code file')
  .example('package')
  .example('package --template ./config/sam.json --environment production')
  .action(packageProject)

module.exports = cli
