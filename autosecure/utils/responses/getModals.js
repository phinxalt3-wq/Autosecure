const path = require("path")
const getAllFiles = require("../utils/getFiles")

const modalCache = {
  default: null,
  otherdir: null
}

module.exports = (dirname, exceptions = [], otherdir = false) => {
  const cacheKey = otherdir ? 'otherdir' : 'default'

  if (modalCache[cacheKey]) {
    // console.log(`Using cached modals for mode: ${cacheKey}`)
    return modalCache[cacheKey]
  }

  // console.log(`Loading new modals for mode: ${cacheKey}`)
  let modals = []

  const baseDir = otherdir 
    ? path.join(dirname, '..', "modals") 
    : path.join(dirname, '..', "..", "modals")

  const modalCategories = getAllFiles(baseDir, true)

  for (const modalCategory of modalCategories) {
    const modalFiles = getAllFiles(modalCategory)

    for (const modalFile of modalFiles) {
      if (path.extname(modalFile) !== ".js") continue

      try {
        delete require.cache[require.resolve(modalFile)]
        const modal = require(modalFile)

        if (exceptions.includes(modal.name)) continue

        modals.push(modal)
      } catch (e) {
        console.error(`Error loading modal ${modalFile}:`, e)
      }
    }
  }

  modalCache[cacheKey] = modals
  return modals
}
