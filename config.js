const fs = require('fs')

const defaultConfig = {
    input_delay: 100
}

const configFile = fs.existsSync('config.json')
    ? JSON.parse(fs.readFileSync('config.json'))
    : defaultConfig

module.exports = configFile

