/* eslint-disable no-console */

const { cyan, green, yellow, red } = require('chalk')
const prefix = '[sammie]'

function info(...args) {
  console.info(cyan(prefix), ...args)
  return log
}

function error(...args) {
  console.error(red(args))
  return log
}

function command(...args) {
  console.log(yellow(args))
  return log
}

function success(...args) {
  console.info(green(prefix), ...args, green('✔︎'))
  return log
}

function raw(...args) {
  console.log(...args)
  return log
}

const log = { info, error, command, success, raw }

module.exports = log
