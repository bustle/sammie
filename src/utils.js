const { spawn } = require('child_process')
const { join } = require('path')
const { readFileSync, writeFile, unlink } = require('fs')
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

function loadTemplate(input) {
  if (input.template) return readTemplate(input.template)
  const defaultTemplates = ['sam.json', 'sam.yaml']
  for (let i = 0; i < defaultTemplates.length; i++) {
    try {
      return readTemplate(defaultTemplates[i])
    } catch (e) {}
  }
  throw Error('Template not found')
}

function readTemplate(filename) {
  const templatePath = join(process.cwd(), filename)
  const templateString = readFileSync(templatePath, 'utf8')
  return { templatePath, templateString }
}

const writeFileAsync = promisify(writeFile)
const delteFileAsync = promisify(unlink)

module.exports = { log, spawnAsync, stackSafeName, resourceSafeName, loadTemplate, writeFileAsync, delteFileAsync }
