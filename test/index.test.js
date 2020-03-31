const assert = require('assert')
const sammie = require('../src/index')

process.on('unhandledRejection', (e) => {
  throw e
})

describe('sammie', () => {
  it('exists', () => {
    assert.ok(sammie)
  })
})
