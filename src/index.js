const parseArgs = require('minimist')

const startServer = require('./server.js')

const {
  port = 3000,
  lock,
  help
} = parseArgs(process.argv.slice(2), {
  boolean: ['lock', 'help'],
  alias: {
    p: 'port',
    l: 'lock',
    h: 'help'
  }
})

if (help) {
  console.log('npm start -- [OPTIONS]')
  console.log('--port=<port> (-p <port>)\n\tSet the port for the server. (Default 3000)')
  console.log('--lock (-l)\n\tDisables the ability to rename and delete cloud variables. (Enabled by default)')
  console.log('--help (-h)\n\tDisplay help')
  process.exit(0)
} else {
  startServer({ port, lockVars: lock })
}
