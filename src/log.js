const CYAN = '\x1b[36m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const RESET = '\x1b[0m'
const CHECK = `${GREEN}✔︎${RESET}`

function info(...args) {
  console.info(`${CYAN}[sammie]${RESET}`, ...args) // eslint-disable-line no-console
  return log
}

function error(...args) {
  console.error(RED, ...args, RESET) // eslint-disable-line no-console
  return log
}

function command(...args) {
  console.log(YELLOW, ...args, RESET) // eslint-disable-line no-console
  return log
}

function success(...args) {
  return info(...args, CHECK)
}

const log = { info, success, error, command }

module.exports = log
