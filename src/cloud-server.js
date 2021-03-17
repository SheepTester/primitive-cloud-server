const path = require('path')

const { readFile, writeFile } = require('./util.js')

const validProjectId = /^\w+$/

class CloudServer {
  constructor () {
    this.projects = new Map()

    this.handleWsConnection = this.handleWsConnection.bind(this)
  }

  async getProject (id) {
    const project = this.projects.get(id)
    if (project) return project

    if (!validProjectId.test(id)) return null

    const savePath = path.resolve(__dirname, `../cloud-vars/${id}.json`)
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
        return
      }
      switch (message.method) {
        case 'handshake':
          if (!handshaken) {
            handshaken = true
            this.getProject(message.project_id)
              .then(projectData => {
                if (projectData) {
                  project = projectData
                  project.connections.add(ws)
                  this.reply(ws, Object.entries(project.variables)
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
  }
}

module.exports = CloudServer
