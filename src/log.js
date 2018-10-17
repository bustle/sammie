const { cyan, green, yellow, red } = require('chalk')
const prefix = '[sammie]'

function info(...args) {
  console.info(cyan(prefix), ...args) // eslint-disable-line no-console
  return log
}

function error(...args) {
  console.error(red(args)) // eslint-disable-line no-console
  return log
}

function command(...args) {
  console.log(yellow(args)) // eslint-disable-line no-console
  return log
}

function success(...args) {
  console.info(green(prefix), ...args, green('✔︎')) // eslint-disable-line no-console
  return log
}

const log = { info, success, error, command }

module.exports = log
