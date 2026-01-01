const path = require("path");
const getAllFiles = require("../utils/getFiles");
const buttonCache = {
  default: null,
  otherdir: null
};

module.exports = (dir, exceptions = [], otherdir = false) => {
  const cacheKey = otherdir ? 'otherdir' : 'default';
  if (buttonCache[cacheKey]) return buttonCache[cacheKey];
  
  let buttons = [];
  const baseDir = otherdir 
    ? path.join(dir, '..', "Buttons")
    : path.join(dir, '..', '..', "Buttons");

  const buttonCategories = getAllFiles(baseDir, true);

  for (const buttonCategory of buttonCategories) {
    const buttonFiles = getAllFiles(buttonCategory);
    for (const buttonFile of buttonFiles) {
      if (path.extname(buttonFile) !== ".js") continue;
      try {
        delete require.cache[require.resolve(buttonFile)];
        const button = require(buttonFile);
        if (!exceptions.includes(button.name)) {
          buttons.push(button);
        }
      } catch (e) {
        console.error(`Error loading button ${buttonFile}:`, e);
      }
    }
  }

  buttonCache[cacheKey] = buttons;
  return buttons;
};
