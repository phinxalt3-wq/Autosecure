const { REST, Routes } = require("discord.js");
const fs = require("fs");

const logCommand = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync("command_logs.txt", logMessage);
};

module.exports = async (clientid, commands, token) => {
    const rest = new REST().setToken(token);
    try {
    //    logCommand("Starting to update application commands...");
        await rest.put(
            Routes.applicationCommands(clientid),
            { body: commands }
        );
     //   logCommand("Successfully updated application commands.");
    } catch (error) {
        console.log(error)
        if (error.response && error.response.data) {
         //   logCommand(`Detailed error: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        console.error(error);
    }
};
