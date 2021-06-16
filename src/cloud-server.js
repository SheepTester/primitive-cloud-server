const path = require('path')

const { readFile, writeFile } = require('./util.js')

const validProjectId = /^\w+$/

class CloudServer {
  constructor ({ lockVars = false } = {}) {
    this.projects = new Map()
    this.lockVars = lockVars

    this.handleWsConnection = this.handleWsConnection.bind(this)
  }

  async getProject (id) {
    const project = this.projects.get(id)
    if (project) return project

    if (!validProjectId.test(id)) return null

    const savePath = path.resolve(__dirname, `../cloud-vars/${id}.json`)
    let variables
    try {
      variables = JSON.parse(await readFile(savePath).catch(() => '{}'))
    } catch (err) {
      console.error(`Encountered an error parsing the cloud variable data at cloud-vars/${id}.json:`)
      console.error(err)
      console.error('This might mean that the file is corrupt, but it may be recoverable.')
      return null
    }
    const connections = new Set()
    let saveTimeout = null
    const projectData = {
      variables,
      connections,
      save: () => {
        if (saveTimeout) return
        saveTimeout = setTimeout(() => {
          writeFile(savePath, JSON.stringify(variables))
          saveTimeout = null
        }, 1000)
      },
      announce: (announcer, messages) => {
        for (const ws of connections) {
          if (ws !== announcer) {
            this.reply(ws, messages)
          }
        }
      }
    }
    this.projects.set(id, projectData)
    return projectData
  }

  reply (ws, messages) {
    ws.send(messages.map(message => JSON.stringify(message) + '\n').join(''))
  }

  handleWsConnection (ws) {
    let handshaken = false
    let project = null

    ws.on('message', data => {
      let message
      try {
        message = JSON.parse(data)
      } catch (err) {
        console.error('I received invalid JSON over the Websocket connection.')
        console.error(data)
        console.error(err)
        console.error('This might mean that someone is trying to tamper with your server.')
        return
      }
      switch (message.method) {
        case 'handshake':
          if (!handshaken) {
            handshaken = true
            this.getProject(message.project_id).then(projectData => {
              if (projectData) {
                project = projectData
                project.connections.add(ws)
                const changes = Object.entries(project.variables).map(([variable, value]) => ({
                  method: 'set',
                  name: variable,
                  value
                }))
                this.reply(ws, changes)
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
          if (project && !this.lockVars) {
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
          if (project && !this.lockVars) {
            delete project.variables[message.name]
            project.save()
          }
          break
        default:
          console.error(`I received an unknown method ${message.method}.`)
      }
    })

    ws.on('error', console.error)

    ws.on('close', () => {
      if (project) {
        project.connections.delete(ws)
      }
    })
  }
}

module.exports = CloudServer
