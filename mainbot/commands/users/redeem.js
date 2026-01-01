const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, TextInputBuilder, ModalBuilder, TextInputStyle } = require('discord.js');


module.exports = {
  name: "redeem",
  description: `Redeem your purchased license time/extra slots using a key`,
  callback: async (client, interaction) => {
    try {
      const modal = new ModalBuilder()
        .setCustomId('licensemodal')
        .setTitle('License Key');

      const licenseInput = new TextInputBuilder()
        .setCustomId('licenseInput')
        .setMaxLength(256)
        .setMinLength(0)
        .setRequired(false)
        .setLabel("License Key")
        .setPlaceholder("Type in your purchased license-key")
        .setStyle(TextInputStyle.Short);

      const actionRow = new ActionRowBuilder().addComponents(licenseInput);
      modal.addComponents(actionRow);

      await interaction.showModal(modal);
    } catch (error) {
      console.error('Error showing modal:', error);
    }
  }
};