const { EmbedBuilder } = require("discord.js");
const axios = require('axios');
const profile = require('../../utils/minecraft/profile');

module.exports = {
  name: "optifinecape",
  ownerOnly: true,
  callback: async (client, interaction) => {
    try {
      let name = null;
      let ssid = interaction.customId.split("|")[1];
      let minecraft = await profile(ssid);
      
      if (minecraft?.name) {
        name = minecraft.name;
      } else {
        name = interaction.customId.split("|")[2];
      }
      
      let link = `http://s.optifine.net/capes/${name}.png`;
      let isvalidreq;
      
      try {
        isvalidreq = await axios.get(link);
      } catch (err) {
        isvalidreq = null;
      }

      let content2;
      if (isvalidreq && isvalidreq.status === 200) {
        content2 = link;
      } else {
        content2 = `Couldn't find an OptiFine Cape for this user.`;
      }

      interaction.reply({
        ephemeral: true,
        content: content2
      });
    } catch (err) {
      interaction.reply({
        ephemeral: true,
        content: `An error occurred: ${err.message}`
      });
    }
  }
};