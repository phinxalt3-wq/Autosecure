const { ApplicationCommandOptionType, EmbedBuilder, TextInputStyle } = require('discord.js');
const showproxiespanel = require('../../utils/utils/showproxiespanel');
const modalBuilder = require('../../utils/modalBuilder');

module.exports = {
  name: "quarantine",
  description: 'Setup Hypixel quarantine!',
  enabled: true,
  options: [
    {
      name: "options",
      description: "Select an option",
      type: ApplicationCommandOptionType.String, 
      required: true,
      choices: [
        { name: "Add to Quarantine", value: "addtoquarantine" },
        { name: "Open Proxies Panel", value: "proxies" }
      ]
    }
  ],
  userOnly: true,
  async execute(client, interaction) {
    const option = interaction.options.getString("options");
    if (option === "addtoquarantine") {
      interaction.showModal(modalBuilder(`addtoquarantine`, `Enter SSID to Quarantine`, [
        {
          setCustomId: 'quarantinessid',
          setMaxLength: 3999,
          setMinLength: 0,
          setRequired: true,
          setLabel: "SSID",
          setPlaceholder: "Enter the SSID",
          setStyle: TextInputStyle.Short
        }
      ]));
    } else if (option === "proxies") {
      return interaction.reply(await showproxiespanel(client, interaction.user.id));
    }
  }
};
