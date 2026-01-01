const { ApplicationCommandOptionType } = require('discord.js');
const bancheckmsg = require('../../utils/bancheckappeal/bancheckmsg');

module.exports = {
  name: 'checkban',
  description: 'Check if a Minecraft account is banned on Hypixel',
  enabled: true,
  options: [
    {
      name: 'ssid',
      description: 'The SSID to check',
      type: ApplicationCommandOptionType.String,
      required: true
    }
  ],
  userOnly: true,
  callback: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });

    try {
      const ssid = interaction.options.getString('ssid');
      const result = await bancheckmsg(ssid);
      await interaction.editReply(result);
    } catch (error) {
      console.error('Ban check error:', error);
      await interaction.editReply({
        embeds: [
          {
            color: 0xff0000,
            title: 'Error',
            description: 'Failed to check ban, dm me with this ty.'
          }
        ]
      });
    }
  }
};
