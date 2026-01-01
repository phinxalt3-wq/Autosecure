
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  name: "removefield",
  callback: async (client, interaction) => {
    try {

      const message = interaction.message;
      

      if (!message.embeds || message.embeds.length === 0) {
        return interaction.reply({
          content: "No embeds found in this message!",
          ephemeral: true
        });
      }
      

      const embed = message.embeds[0];
      if (!embed.fields || embed.fields.length === 0) {
        return interaction.reply({
          content: "This embed doesn't have any fields to remove!",
          ephemeral: true
        });
      }


      const modal = new ModalBuilder()
        .setCustomId('remove-field-modal')
        .setTitle('Remove Embed Field');


      let fieldsList = "";
      embed.fields.forEach((field, index) => {
        fieldsList += `${index + 1}. ${field.name}\n`;
      });


      const fieldIndexInput = new TextInputBuilder()
        .setCustomId('fieldIndex')
        .setLabel(`Field Index (1-${embed.fields.length})`)
        .setPlaceholder('Enter the number of the field to remove')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);


      const fieldsListInput = new TextInputBuilder()
        .setCustomId('fieldsList')
        .setLabel('Available Fields')
        .setValue(fieldsList.substring(0, 4000))
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);


      const firstRow = new ActionRowBuilder().addComponents(fieldIndexInput);
      const secondRow = new ActionRowBuilder().addComponents(fieldsListInput);

      modal.addComponents(firstRow, secondRow);


      await interaction.showModal(modal);
      
    } catch (error) {
      console.error("Error in remove field button:", error);
      await interaction.reply({
        content: "An error occurred while creating the remove field modal.",
        ephemeral: true
      });
    }
  }
};