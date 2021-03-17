const fs = require('fs')

module.exports.readFile = filePath => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}

module.exports.writeFile = (filePath, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, err => {
      if (err) reject(err)
      else resolve()
    })
  })
}

module.exports.exists = filePath => {
  return new Promise(resolve => {
    fs.access(filePath, err => {
      resolve(!err)
    })
  })
}
