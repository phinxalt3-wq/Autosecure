const {
  ActionRowBuilder,
  ButtonBuilder,
} = require("discord.js");
const getButton = require("../../utils/responses/getButton");
const { queryParams } = require("../../../db/database");

module.exports = {
  name: "sendjson",
  sendembeds: true, 
  callback: async (client, interaction) => {
    try {
      const parts = interaction.customId.split("|");
      const userId = parts[1];
      const showExtraButton = parts[2] === 'true';
      const hideAllButtons = parts[3] === 'true';

      const embedJson = interaction.fields.getTextInputValue('json');
      const embedData = JSON.parse(embedJson);
      const embeds = Array.isArray(embedData.embeds) ? embedData.embeds : [embedData];

      let responseMessage = "Successfully imported and sent your custom embed";
      let components = [];

      if (!hideAllButtons) {
        // Main verification button
        const buttonData = await getButton(client, 'link account');
        const cleanButtonData = JSON.parse(JSON.stringify(buttonData.data));
        delete cleanButtonData.id; // Remove deprecated id field
        cleanButtonData.custom_id = cleanButtonData.custom_id || "link_account"; // Ensure custom_id exists

        const actionRow = new ActionRowBuilder().addComponents(
          ButtonBuilder.from(cleanButtonData)
        );

        // Add extra button if requested
        if (showExtraButton) {
          const [extraButtonData] = await queryParams(
            `SELECT * FROM embeds WHERE user_id=? AND type=?`,
            [userId, 'extrabutton']
          );

          if (extraButtonData) {
            const extraButtonJson = await getButton(client, 'extrabutton');
            const cleanExtraButtonData = JSON.parse(JSON.stringify(extraButtonJson.data));
            delete cleanExtraButtonData.id;
            cleanExtraButtonData.custom_id = "extrabutton"; // Ensure custom_id is set
            
            actionRow.addComponents(
              ButtonBuilder.from(cleanExtraButtonData)
            );
            responseMessage += " with verification and extra buttons!";
          } else {
            responseMessage += " with verification button (extra button embed isn't set yet)";
          }
        } else {
          responseMessage += " with verification button";
        }

        components.push(actionRow);
      } else {
        responseMessage += " (no buttons)";
      }

      await interaction.channel.send({
        embeds: embeds,
        components: components
      });

      await interaction.reply({
        content: responseMessage,
        ephemeral: true
      });

    } catch (error) {
      console.error("Error processing embed JSON:", error);
      await interaction.reply({
        content: "Error processing the embed JSON. Please check your format and try again.",
        ephemeral: true
      });
    }
  }
};