const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
  name: "editPlaceholder",
editmodals: true,
  callback: async (client, interaction) => {
    const [, modalType, botnumber, ownerid] = interaction.customId.split("|");

    const modal = new ModalBuilder()
      .setCustomId(`submitPlaceholder|${modalType}|${botnumber}|${ownerid}`)
      .setTitle(`Edit Placeholder - ${modalType}`);

    const input = new TextInputBuilder()
      .setCustomId("placeholderInput")
      .setLabel("Enter the Placeholder")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    await interaction.showModal(modal);
  },
};
