const path = require("path")
const getAllFiles = require("../utils/getFiles")
const getButtons = require("../utils/getButtons")
const getModals = require("../utils/getModals")

module.exports = (client, token) => {
  client.buttons = getButtons(__dirname, [], true)
  client.modals = getModals(__dirname, [], true)

  const eventFolders = getAllFiles(path.join(__dirname, '..', 'events'), true)
  for (const eventFolder of eventFolders) {
    const eventFiles = getAllFiles(eventFolder)
    eventFiles.sort((a, b) => a.localeCompare(b))
    const eventName = eventFolder.replace(/\\/g, '/').split('/').pop()
    
    client.on(eventName, async (arg) => {
      for (const eventFile of eventFiles) {
        const eventFunction = require(eventFile)
        if (typeof eventFunction !== "function") {
          console.error(`Invalid event file: ${eventFile} does not export a function.`)
          continue
        }
        await eventFunction(client, arg, token)
      }
    })
  }
}