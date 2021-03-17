const parseArgs = require('minimist')

const startServer = require('./server.js')

const {
  port = 3000,
  help
} = parseArgs(process.argv.slice(2), {
  boolean: ['help'],
  alias: {
    p: 'port',
    h: 'help'
  }
})

if (help) {
  console.log('npm start -- [OPTIONS]')
  console.log('--port=<port> (-p <port>)\n\tSet the port for the server. (Default 3000)')
  console.log('--help (-h)\n\tDisplay help')
  process.exit(0)
} else {
  startServer(port)
}
