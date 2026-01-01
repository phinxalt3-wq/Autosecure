const { ApplicationCommandOptionType } = require('discord.js');
const ssidcheckermsg = require('../../../autosecure/utils/minecraft/ssidcheckermsg');

module.exports = {
  name: "ssidchecker",
  description: 'Checks your ssid',
  enabled: true,
  options: [
    {
      name: "ssid",
      description: "SSID to check!",
      type: ApplicationCommandOptionType.String,
      required: true
    }
  ],
  userOnly: true,
callback: async (client, interaction) => {
  let ssid = interaction.options.getString("ssid");
  await interaction.deferReply({ ephemeral: true });
  try {
    let response = await ssidcheckermsg(ssid);
    await interaction.editReply(response);
  } catch (error) {
    console.error(error);
    await interaction.editReply({ 
      embeds: [{
        color: 0xff4757,
        title: '❌ SSID Check Error',
        description: `An error occurred while checking your SSID.`,
        thumbnail: {
          url: 'https://cdn.pfps.gg/pfps/59339-erwan-meunier.gif'
        },
        fields: [{
          name: '🔧 Error Details',
          value: `\`${error.message}\``,
          inline: false
        }, {
          name: '💡 What to do?',
          value: '• Make sure the SSID is valid\n• Try generating a new SSID\n• Contact support if the issue persists',
          inline: false
        }],
        footer: {
          text: 'SSID Checker • Autosecure'
        },
        timestamp: new Date().toISOString()
      }],
      ephemeral: true 
    });
  }
}
};
