const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
  name: "editLabel",
editmodals: true,
  callback: async (client, interaction) => {
    const [, modalType, botnumber, ownerid] = interaction.customId.split("|");

    const modal = new ModalBuilder()
      .setCustomId(`submitLabel|${modalType}|${botnumber}|${ownerid}`)
      .setTitle(`Edit Label - ${modalType}`);

    const input = new TextInputBuilder()
      .setCustomId("labelInput")
      .setLabel("Enter the Label")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    await interaction.showModal(modal);
  },
};
