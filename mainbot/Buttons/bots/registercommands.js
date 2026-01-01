const { join } = require("path");
const registcmds = require("../../utils/registerCommands");
const getLocalCmds = require('../../utils/getLocalCmds');
const { autosecureMap } = require("../../handlers/botHandler");
const { queryParams } = require("../../../db/database");

module.exports = {
  name: "registercommands",
  editbot: true,
  callback: async (client, interaction) => {
    try {
       await interaction.deferUpdate();
      const [t, userId, botnumber] = interaction.customId.split("|");
      
      if (!userId || !botnumber) {
        return interaction.editReply({ content: "Error.", ephemeral: true });
      }


      const check = await queryParams(
        'SELECT token FROM autosecure WHERE user_id = ? AND botnumber = ?', 
        [userId, botnumber]
      );

      if (!check || !check[0]?.token) {
        return interaction.editReply({ content: "Bot token not found in database, is this bot deleted?", ephemeral: true });
      }

      const token = check[0].token;
      const botKey = `${userId}|${botnumber}`;
      const botClient = autosecureMap.get(botKey);

      if (!botClient?.user?.id) {
        return interaction.editReply({ content: "Bot seems to be offline, please restart it first.", ephemeral: true });
      }

      const clientId = botClient.user.id;
const commandsFiles = getLocalCmds(join(__dirname, "../../../autosecure/Commands"));


      const commands = commandsFiles
        .filter(cmd => cmd.name && cmd.description) 
        .map(cmd => {
          const { name, description, options } = cmd;
          const commandObj = { name, description };
          if (options?.length > 0) {
            commandObj.options = options;
          }
          return commandObj;
        });

      if (commands.length === 0) {
        return interaction.editReply({ content: "No valid commands found to register.", ephemeral: true });
      }

      await registcmds(clientId, commands, token);
      await interaction.editReply({ content: "Commands registered successfully! Please don't spam this, it'll glitch your bot the fuck out." });
    } catch (error) {
      console.error("Error in registercommands:", error);
      await interaction.editReply({ 
        content: "Failed to register commands, consider restarting your bot.",
        ephemeral: true 
      });
    }
  }
};