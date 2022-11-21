require('dotenv').config()
const express = require('express')
const app = express()
const Sentry = require('@sentry/node')
const Tracing = require('@sentry/tracing')

const sentryInit = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN_URL,
    environment: process.env.NODE_ENV,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Integrations.Express({
        app: app,
      }),
    ],
    tracesSampleRate: 1.0,
  })

  return Sentry
}

const otherFunc = (span) => {
  span = span.startChild({ op: 'otherFunc' })

  span.finish()

  return "Hello from otherFunc"
}

const tracing = sentryInit()
app.use(tracing.Handlers.requestHandler())
app.use(tracing.Handlers.tracingHandler())

app.get('/', (req, res) => {
  const txn = tracing.getCurrentHub()
    .getScope()
    .getTransaction()
  const span = txn.startChild({ op: 'handler.helloWorld' })

  const result = otherFunc(span)
  console.log(result)

  span.finish()

  return res.send('Hello World!')
})

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`)
})