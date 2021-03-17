const path = require('path')
const express = require('express')
const expressWs = require('express-ws')

const CloudServer = require('./cloud-server.js')

function startServer (port) {
  const app = express()
  const cloudServer = new CloudServer()

  expressWs(app)

  app.use(express.static(path.resolve(__dirname, '../static/')))

  app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../index.html'))
  })

  app.ws('/', cloudServer.handleWsConnection)

  app.use((req, res) => {
    res.status(404).sendFile(path.resolve(__dirname, '../static/404.html'))
  })

  app.listen(port, () => {
    console.log(`Your cloud server is available, at least locally, at ws://localhost:${port}/.`)
    console.log('Press ctrl+C to stop the server.')
  })
}

module.exports = startServer
