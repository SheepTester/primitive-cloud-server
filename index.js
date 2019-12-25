const fs = require('fs')
const path = require('path')
function readFile (file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}
function writeFile (file, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, err => {
      if (err) reject(err)
      else resolve()
    })
  })
}
// Create a cloud-vars folder if it doesn't already exist
fs.mkdir(path.resolve(__dirname, './cloud-vars/'), () => {})

const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 3000 })

const projects = new Map()
const validProjectId = /^\w+$/

async function getProject (id) {
  const project = projects.get(id)
  if (project) return project

  if (!validProjectId.test(id)) return null

  const savePath = path.resolve(__dirname, `./cloud-vars/${id}.json`)
  let variables
  try {
    variables = JSON.parse(await readFile(savePath))
  } catch (err) {
    variables = {}
  }
  const connections = new Set()
  let saveTimeout = null
  const projectData = {
    variables,
    connections,
    save () {
      if (saveTimeout) return
      saveTimeout = setTimeout(() => {
        writeFile(savePath, JSON.stringify(variables))
        saveTimeout = null
      }, 1000)
    },
    announce (announcer, messages) {
      for (const ws of connections) {
        if (ws !== announcer) {
          reply(ws, messages)
        }
      }
    }
  }
  projects.set(id, projectData)
  return projectData
}

function reply (ws, messages) {
  ws.send(messages.map(message => JSON.stringify(message) + '\n').join(''))
}

wss.on('connection', ws => {
  let handshaken = false
  let project = null

  ws.on('message', data => {
    const message = JSON.parse(data)
    switch (message.method) {
      case 'handshake':
        if (!handshaken) {
          handshaken = true
          getProject(message.project_id)
            .then(projectData => {
              if (projectData) {
                project = projectData
                project.connections.add(ws)
                reply(ws, Object.entries(project.variables)
                  .map(([variable, value]) => ({
                    method: 'set',
                    name: variable,
                    value
                  })))
              }
            })
        }
        break
      case 'create':
      case 'set':
        if (project) {
          project.variables[message.name] = message.value
          project.announce(ws, [{
            method: 'set',
            name: message.name,
            value: message.value
          }])
          project.save()
        }
        break
      case 'rename':
        if (project) {
          project.variables[message.new_name] = project.variables[message.name]
          delete project[message.name]
          project.announce(ws, [{
            method: 'set',
            name: message.new_name,
            value: message.value
          }])
          project.save()
        }
        break
      case 'delete':
        if (project) {
          delete project.variables[message.name]
          project.save()
        }
        break
    }
  })

  ws.on('close', () => {
    if (project) {
      project.connections.delete(ws)
    }
  })
})

console.log('All ears at ws://localhost:3000/');
