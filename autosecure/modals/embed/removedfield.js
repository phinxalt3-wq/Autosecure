module.exports = {
  name: "remove-field-modal",
  callback: async (client, interaction) => {
    try {

      const message = interaction.message;


      if (!message) {
        return interaction.reply({
          content: "The message associated with this interaction no longer exists or is inaccessible.",
          ephemeral: true,
        });
      }


      if (!message.embeds || message.embeds.length === 0) {
        return interaction.reply({
          content: "No embeds found in this message!",
          ephemeral: true,
        });
      }


      const originalEmbed = message.embeds[0];


      const fieldIndexInput = interaction.fields.getTextInputValue('fieldIndex');
      const fieldIndex = parseInt(fieldIndexInput.trim()) - 1; // Convert to 0-based index


      if (isNaN(fieldIndex) || fieldIndex < 0 || fieldIndex >= originalEmbed.fields.length) {
        return interaction.reply({
          content: "Invalid field index. Please provide a valid number.",
          ephemeral: true,
        });
      }


      const fields = originalEmbed.fields.filter((_, index) => index !== fieldIndex);


      const newEmbed = {
        title: originalEmbed.title,
        description: originalEmbed.description,
        url: originalEmbed.url,
        timestamp: originalEmbed.timestamp,
        color: originalEmbed.color,
        fields: fields,
        author: originalEmbed.author,
        footer: originalEmbed.footer,
        image: originalEmbed.image,
        thumbnail: originalEmbed.thumbnail,
      };


      await interaction.update({
        content: `Field "${originalEmbed.fields[fieldIndex].name}" has been removed from the embed.`,
        embeds: [newEmbed],
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error in remove field modal submission:", error);
      await interaction.reply({
        content: "An error occurred while removing the field from the embed.",
        ephemeral: true,
      });
    }
  },
};