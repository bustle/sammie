const { spawn } = require('child_process')
const { relative } = require('path')
const { existsSync, writeFile, unlink } = require('fs')
const { promisify } = require('util')

const formatCyan = '\x1b[36m'
const formatGreen = '\x1b[32m'
const formatYellow = '\x1b[33m'
const formatRed = '\x1b[31m'
const formatReset = '\x1b[0m'
const checkmark = `${formatGreen}✔︎${formatReset}`

function logInfo(...args) {
  console.info(`${formatCyan}[sammie]${formatReset}`, ...args) // eslint-disable-line no-console
}

function logCommand(...args) {
  console.log(formatYellow, ...args, formatReset) // eslint-disable-line no-console
}

async function spawnAsync(command) {
  const child = spawn(command, { shell: true })
  return new Promise((resolve, reject) => {
    let data = ''
    child.stdout.on('data', chunk => (data += chunk))
    child.stderr.on('data', data => console.error(formatRed, data.toString(), formatReset)) // eslint-disable-line no-console
    child.on('error', reject)
    child.on('exit', code => {
      let response
      try {
        response = JSON.parse(data)
      } catch (e) {
        response = data
      }
      code === 0 ? resolve(response) : reject(Error(code))
    })
  })
}

function stackSafeName(string) {
  return string.trim().replace(/[^a-z0-9]/gi, '-')
}

function resourceSafeName(string) {
  const pascaledString = string.replace(/(-|_|\.|\s)+(.)?/g, (m, s, c) => (c ? c.toUpperCase() : ''))
  return pascaledString.charAt(0).toUpperCase() + pascaledString.slice(1)
}

function findTemplatePath(input) {
  if (input.template) return input.template
  const templatePath = ['sam.json', 'sam.yaml']
    .map(name => relative(process.cwd(), name))
    .find(path => existsSync(path))
  if (templatePath) return templatePath
  throw Error('Template not found')
}

const writeFileAsync = promisify(writeFile)
const delteFileAsync = promisify(unlink)

module.exports = {
  logInfo,
  logCommand,
  checkmark,
  spawnAsync,
  stackSafeName,
  resourceSafeName,
  findTemplatePath,
  writeFileAsync,
  delteFileAsync
}
