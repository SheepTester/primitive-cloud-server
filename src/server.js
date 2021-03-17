const path = require('path')
const publicIp = require('public-ip')
const internalIp = require('internal-ip')
const express = require('express')
const expressWs = require('express-ws')
const colours = require('colors/safe')

const CloudServer = require('./cloud-server.js')

function startServer (port) {
  const app = express()
  const cloudServer = new CloudServer()

  app.disable('x-powered-by')
  expressWs(app)

  app.use(express.static(path.resolve(__dirname, '../static/'), {
    extensions: ['html', 'htm']
  }))

  app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../index.html'))
  })

  app.ws('/', cloudServer.handleWsConnection)

  app.use((req, res) => {
    res.status(404).sendFile(path.resolve(__dirname, '../static/404.html'))
  })

  app.listen(port, async () => {
    console.log(colours.green('I\'m now running your cloud server!'))
    console.log('You can access it...')
    console.log(`  • on your computer at ${colours.cyan(`ws://localhost:${port}/`)} (use this for testing)`)
    console.log(`  • locally within your network at ${colours.blue(`ws://${await internalIp.v4()}:${port}/`)} (maybe)`)
    console.log(`  • publicly at ${colours.blue(`ws://${await publicIp.v4()}:${port}/`)}, but ONLY if you've set up port forwarding on your router`)
    console.log(colours.yellow(`I\'m also serving files from the static/ folder, which you can access in your browser at ${colours.blue(`http://localhost:${port}/`)}.`))
    console.log(colours.red('Press control+C to stop the server.'))
  })
}

module.exports = startServer
