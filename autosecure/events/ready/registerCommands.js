const registerCommands = require("../../utils/utils/registerCommands");
const getLocalCmds = require("../../utils/utils/getLocalCmds");
const { join } = require("path");

module.exports = async (client, args, token) => {
  try {
    const clientId = client.user.id;
    const commandsDir = join(__dirname, "..", "..", "Commands");
    const commandsfiles = getLocalCmds(commandsDir);
    let commands = [];

    for (let commandfile of commandsfiles) {
      const { name, description, options, filePath } = commandfile;

      if (!name || typeof name !== "string") {
        console.error(`❌ Command is missing a valid name\n→ File: ${filePath || "Unknown file"}`);
        continue;
      }

      if (!description || typeof description !== "string") {
        console.error(`❌ Command "${name}" is missing a valid description\n→ File: ${filePath || "Unknown file"}`);
        continue;
      }

      let obj = { name, description };
      if (Array.isArray(options) && options.length > 0) {
        obj.options = options;
      }

      commands.push(obj);
    }

    await registerCommands(clientId, commands, token);
    console.log(`${client.user.tag} --> ${client.user.id}`);
  } catch (e) {
    console.error("❌ Failed to register commands. Verifying contents of requestBody...");

    if (Array.isArray(e.requestBody?.json)) {
      e.requestBody.json.forEach((cmd, index) => {
        if (!cmd.description) {
          console.error(`❌ Command at index ${index} ("${cmd.name || "unknown"}") is missing a description`);
        }
      });
    }

    console.error(e);
  }
};
