const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
  name: "editTitle",
editmodals: true,
  callback: async (client, interaction) => {
    const [, modalType, botnumber, ownerid] = interaction.customId.split("|");

    const modal = new ModalBuilder()
      .setCustomId(`submitTitle|${modalType}|${botnumber}|${ownerid}`)
      .setTitle(`Edit Title - ${modalType}`);

    const input = new TextInputBuilder()
      .setCustomId("titleInput")
      .setLabel("Enter the Title")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    await interaction.showModal(modal);
  },
};
