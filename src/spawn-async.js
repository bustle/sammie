const { spawn } = require('child_process')

async function spawnAsync(command) {
  const child = spawn(command, { shell: true, stdio: 'inherit' })
  return new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('exit', code => (code === 0 ? resolve(child.stdout) : reject(Error(code))))
  })
}

module.exports = spawnAsync
