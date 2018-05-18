const CYAN = '\x1b[36m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const RESET = '\x1b[0m'
const checkmark = `${GREEN}✔︎${RESET}`

function logInfo(...args) {
  console.info(`${CYAN}[sammie]${RESET}`, ...args) // eslint-disable-line no-console
}

function logSuccess(...args) {
  logInfo(...args, checkmark)
}

function logError(...args) {
  console.error(RED, ...args, RESET) // eslint-disable-line no-console
}

function logCommand(...args) {
  console.log(YELLOW, ...args, RESET) // eslint-disable-line no-console
}

module.exports = { logInfo, logSuccess, logError, logCommand, checkmark }
