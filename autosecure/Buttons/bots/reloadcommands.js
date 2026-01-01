const { join } = require("path");
const registcmds = require("../../../mainbot/utils/registerCommands");
const getLocalCmds = require('../../../mainbot/utils/getLocalCmds');
const { autosecureMap } = require("../../../mainbot/handlers/botHandler");
const { queryParams } = require("../../../db/database");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "reloadcommands",
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
      
      const successEmbed = new EmbedBuilder()
        .setColor(6672632)
        .setTitle("Synced your command tree")
        .setDescription("Your commands have been refreshed, please restart your discord client to be able to see the changes.\n\n**Do not spam this as it could break your bot.**");
      
      await interaction.followUp({
        embeds: [successEmbed],
        ephemeral: true
      });
    } catch (error) {
      console.error("Error in reloadcommands:", error);
      await interaction.editReply({ 
        content: "Failed to reload commands, consider restarting your bot.",
        ephemeral: true 
      });
    }
  }
};
