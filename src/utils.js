const { spawn } = require('child_process')
const { writeFile, unlink } = require('fs')
const { promisify } = require('util')

async function spawnAsync(command) {
  const child = spawn(command, { shell: true, stdio: 'inherit' })
  return new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('exit', code => (code === 0 ? resolve(child.stdout) : reject(Error(code))))
  })
}

function pascalCaseString(string) {
  const pascaledString = string.replace(/(-|_|\.|\s)+(.)?/g, (m, s, c) => (c ? c.toUpperCase() : ''))
  return pascaledString.charAt(0).toUpperCase() + pascaledString.slice(1)
}

const writeFileAsync = promisify(writeFile)
const delteFileAsync = promisify(unlink)

module.exports = { spawnAsync, pascalCaseString, writeFileAsync, delteFileAsync }
