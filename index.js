exports.handler = async (event, context) => {
  const body = `
    <h1>Hello test1!</h1>
    <details>
      <summary>Event</summary>
      <pre>${JSON.stringify(event, null, 2)}</pre>
    </details>
    <details>
      <summary>Context</summary>
      <pre>${JSON.stringify(context, null, 2)}</pre>
    </details>`

  return {
    statusCode: 200,
    headers: { 'content-type': 'text/html' },
    body
  }
}
