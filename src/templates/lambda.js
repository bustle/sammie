const template = (event, context) => {
  const body = `
    <h1>Hello __NAME__!</h1>
    <details>
      <summary>Event</summary>
      <pre>${JSON.stringify(event, null, 2)}</pre>
    </details>
    <details>
      <summary>Context</summary>
      <pre>${JSON.stringify(context, null, 2)}</pre>
    </details>`

  return Promise.resolve({ statusCode: 200, headers: { 'content-type': 'text/html' }, body })
}

module.exports = 'exports.handler = ' + template.toString() + '\n'
