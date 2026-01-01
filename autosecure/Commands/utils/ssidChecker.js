const { ApplicationCommandOptionType } = require('discord.js');
const ssidcheckermsg = require('../../utils/minecraft/ssidcheckermsg')

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
    await interaction.editReply({ content: `Error checking SSID: ${error.message}`, ephemeral: true });
  }
}
};
