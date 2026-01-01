async function ignNameModifier(mcname) {
    let newName = mcname;
    if (newName.length < 16) {
        newName += "_";
    } else {
        newName = newName.replace(/.$/, ".");
    }
    return newName;
}

module.exports = ignNameModifier
