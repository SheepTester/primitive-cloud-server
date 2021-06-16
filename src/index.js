const parseArgs = require('minimist')

const startServer = require('./server.js')

const {
  port = 3000,
  lock,
  'per-message-deflate': perMessageDeflate,
  help
} = parseArgs(process.argv.slice(2), {
  boolean: ['lock', 'per-message-deflate', 'help'],
  alias: {
    p: 'port',
    l: 'lock',
    D: 'per-message-deflate',
    h: 'help'
  }
})

if (help) {
  console.log('npm start -- [OPTIONS]')
  console.log('--port=<port> (-p <port>)\n\tSet the port for the server. (Default 3000)')
  console.log('--lock (-l)\n\tDisables the ability to rename and delete cloud variables. (Enabled by default)')
  console.log('--per-message-deflate (-D)\n\tEnable permessage-deflate compression, which has a slight impact on performance (Disabled by default)')
  console.log('--help (-h)\n\tDisplay help')
  process.exit(0)
} else {
  startServer({ port, lockVars: lock, perMessageDeflate })
}
