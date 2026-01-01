const { EmbedBuilder } = require('discord.js');
const { getmxbl } = require('../../utils/secure/getxbl3');
const { disablemultiplayer } = require('../../utils/secure/disablemultiplayer');

module.exports = {
  name: "minecraftmpdisable",
  ownerOnly: true,
  callback: async (client, interaction) => {
    try {
      await interaction.deferReply({ ephemeral: true });

      const [t, xblrefresh, time] = interaction.customId.split('|');
      
      const mxblresult = await getmxbl(null, xblrefresh);
      if (!mxblresult) {
        const embed = new EmbedBuilder()
          .setColor("#FF0000")
          .setTitle("Couldn't refresh XBL token. Cookie or token probably expired.");
        return interaction.editReply({ embeds: [embed] });
      }

      const { xbl } = mxblresult;

      const status = await disablemultiplayer(xbl, true);
      const statusmsg = status
        ? `Disabled multiplayer!`
        : `Couldn't disable multiplayer. Cookie probably expired. Try to do it manually through https://zyger.net/multiplayer`;

      const embed = new EmbedBuilder()
        .setColor("#AEC8E8")
        .setTitle(statusmsg);

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Error in minecraftmpdisable:", error);
      return interaction.editReply({
        content: "An error occurred while disabling multiplayer."
      });
    }
  }
};
