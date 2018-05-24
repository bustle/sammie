const { spawn } = require('child_process')
const { relative } = require('path')
const { existsSync, readFile, writeFile, unlink } = require('fs')
const { promisify } = require('util')
const log = require('./log')

async function spawnAsync(command) {
  const child = spawn(command, { shell: true })
  return new Promise((resolve, reject) => {
    let data = ''
    child.stdout.on('data', chunk => (data += chunk))
    child.stderr.on('data', data => log.error(data.toString()))
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
  findTemplatePath,
  readFileAsync: promisify(readFile),
  writeFileAsync: promisify(writeFile),
  deleteFileAsync: promisify(unlink)
}
