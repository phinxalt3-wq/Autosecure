const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

module.exports = {
  name: "editStyle",
editmodals: true,
  callback: async (client, interaction) => {
    const [, modalType, botnumber, ownerid] = interaction.customId.split("|");

    const modal = new ModalBuilder()
      .setCustomId(`submitStyle|${modalType}|${botnumber}|${ownerid}`)
      .setTitle(`Edit Style - ${modalType}`);

    const input = new TextInputBuilder()
      .setCustomId("styleInput")
      .setLabel("Enter Style (short or paragraph)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));

    await interaction.showModal(modal);
  },
};
