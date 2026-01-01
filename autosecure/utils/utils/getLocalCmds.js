const path = require("path")
const getAllFiles = require("./getFiles")
module.exports = (dir,exceptions=[]) => { 
  let localCommands = []
  const cmdCategories = getAllFiles(
    dir,true
  )
  for (const cmdCategory of cmdCategories) { 
    
    const cmdFiles = getAllFiles(cmdCategory)
    
    for (const cmdFile of cmdFiles) {
      if (path.extname(cmdFile) === ".json") {
              continue
      }
      const cmdObj = require(cmdFile)
      
      
      if (exceptions.includes(cmdObj.name)) {
        continue
      }

      localCommands.push(cmdObj)
    }
  }
  return localCommands
}