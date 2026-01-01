
module.exports = {
  name: "add-field-modal",
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


      const fieldName = interaction.fields.getTextInputValue("fieldName");
      const fieldValue = interaction.fields.getTextInputValue("fieldValue");
      const inline = interaction.fields.getTextInputValue("inline").toLowerCase() === "true";


      let position;
      try {
        const posInput = interaction.fields.getTextInputValue("position");
        if (posInput && posInput.trim() !== "") {
          position = parseInt(posInput.trim()) - 1; // Convert to 0-based index


          if (isNaN(position) || position < 0) {
            position = originalEmbed.fields ? originalEmbed.fields.length : 0;
          }
        } else {

          position = originalEmbed.fields ? originalEmbed.fields.length : 0;
        }
      } catch (e) {

        position = originalEmbed.fields ? originalEmbed.fields.length : 0;
      }


      const newField = {
        name: fieldName,
        value: fieldValue,
        inline: inline,
      };


      let fields = originalEmbed.fields ? [...originalEmbed.fields] : [];


      fields.splice(position, 0, newField);


      if (fields.length > 25) {
        return interaction.reply({
          content: "Cannot add field. Discord embeds are limited to 25 fields maximum.",
          ephemeral: true,
        });
      }


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
        content: `Field "${fieldName}" has been added to the embed.`,
        embeds: [newEmbed],
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error in add field modal submission:", error);
      await interaction.reply({
        content: "An error occurred while adding the field to the embed.",
        ephemeral: true,
      });
    }
  },
};