const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

module.exports = {
  name: 'ssidhelp',
  callback: async (client, interaction) => {
    try {
      const embed = new EmbedBuilder()
        .setTitle('SSID Information')
        .setDescription('A SSID (Session-ID) for Minecraft is a temporary authentication token that you can use for max. 24 hours to log onto a Minecraft Account.\n\n**How do I log on with it?**\nUse the SchubiAuth mod and put it into the mods folder of a 1.8.9 instance of Forge. See the attachment for this mod. To generate an SSID, use /getssid!')
        .setColor('#c6d2dd');

      const attachment = new AttachmentBuilder(path.join(__dirname, './SchubiAuthV2.jar'), { name: 'SchubiAuthV2.jar' });

      await interaction.reply({
        embeds: [embed],
        files: [attachment],
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error sending SSID attachment:', error);
      await interaction.reply({ content: 'There was an error processing your request.', ephemeral: true });
    }
  },
};
