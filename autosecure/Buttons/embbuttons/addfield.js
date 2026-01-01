
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  name: "addfield",
  callback: async (client, interaction) => {
    try {

      const modal = new ModalBuilder()
        .setCustomId('add-field-modal')
        .setTitle('Add Embed Field');


      const fieldNameInput = new TextInputBuilder()
        .setCustomId('fieldName')
        .setLabel('Field Name (max 256 characters)')
        .setPlaceholder('Enter the field name')
        .setStyle(TextInputStyle.Short)
        .setMaxLength(256)
        .setRequired(true);


      const fieldValueInput = new TextInputBuilder()
        .setCustomId('fieldValue')
        .setLabel('Field Value (max 1024 characters)')
        .setPlaceholder('Enter the field value. Markdown is supported.')
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(1024)
        .setRequired(true);


      const inlineInput = new TextInputBuilder()
        .setCustomId('inline')
        .setLabel('Inline? (true/false)')
        .setPlaceholder('Type "true" for inline, "false" for not inline')
        .setStyle(TextInputStyle.Short)
        .setValue('false')
        .setRequired(true);


      const positionInput = new TextInputBuilder()
        .setCustomId('position')
        .setLabel('Position (optional)')
        .setPlaceholder('Enter field position (1-25). Leave empty for end.')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);


      const firstRow = new ActionRowBuilder().addComponents(fieldNameInput);
      const secondRow = new ActionRowBuilder().addComponents(fieldValueInput);
      const thirdRow = new ActionRowBuilder().addComponents(inlineInput);
      const fourthRow = new ActionRowBuilder().addComponents(positionInput);

      modal.addComponents(firstRow, secondRow, thirdRow, fourthRow);


      await interaction.showModal(modal);
      
    } catch (error) {
      console.error("Error in add field button:", error);
      await interaction.reply({
        content: "An error occurred while creating the add field modal.",
        ephemeral: true
      });
    }
  }
};