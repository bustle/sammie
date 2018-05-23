const { spawn } = require('child_process')
const { relative } = require('path')
const { existsSync, readFile, writeFile, unlink } = require('fs')
const { promisify } = require('util')
const { logError } = require('./log')

async function spawnAsync(command) {
  const child = spawn(command, { shell: true })
  return new Promise((resolve, reject) => {
    let data = ''
    child.stdout.on('data', chunk => (data += chunk))
    child.stderr.on('data', data => logError(data.toString()))
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

module.exports = {
  spawnAsync,
  stackSafeName,
  resourceSafeName,
  findTemplatePath,
  readFileAsync: promisify(readFile),
  writeFileAsync: promisify(writeFile),
  deleteFileAsync: promisify(unlink)
}
