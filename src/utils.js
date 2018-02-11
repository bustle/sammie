const { spawn } = require('child_process')
const { writeFile, unlink } = require('fs')
const { promisify } = require('util')

const formatInfo = '\x1b[36m'
const formatError = '\x1b[31m'
const formatReset = '\x1b[0m'

function log(...args) {
  console.log('\n', `${formatInfo}[sammie]${formatReset}`, ...args, '\n') // eslint-disable-line no-console
}

async function spawnAsync(command) {
  const child = spawn(command, { shell: true })
  return new Promise((resolve, reject) => {
    child.stderr.on('data', data => console.error(formatError, data.toString(), formatReset)) // eslint-disable-line no-console
    child.on('error', reject)
    child.on('exit', code => (code === 0 ? resolve(child.stdout) : reject(Error(code))))
  })
}

function stackSafeName(string) {
  return string.trim().replace(/[^a-z0-9]/gi, '-')
}

function resourceSafeName(string) {
  const pascaledString = string.replace(/(-|_|\.|\s)+(.)?/g, (m, s, c) => (c ? c.toUpperCase() : ''))
  return pascaledString.charAt(0).toUpperCase() + pascaledString.slice(1)
}

const writeFileAsync = promisify(writeFile)
const delteFileAsync = promisify(unlink)

module.exports = { log, spawnAsync, stackSafeName, resourceSafeName, writeFileAsync, delteFileAsync }
