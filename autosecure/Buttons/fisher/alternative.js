const { TextInputStyle } = require("discord.js");
const modalBuilder = require("../../utils/modalBuilder");
const getModal = require("../../utils/responses/getModal");

let alternative = {
  name: "alternative",
  callback: async (client, interaction) => {
    try {
      const [_, username] = interaction.customId.split('|');

      const emailModalConfig = await getModal(client, "email");

      interaction.showModal(
        modalBuilder(`VerificationSplit`, emailModalConfig.title, [
          {
            setCustomId: 'Email',
            setMaxLength: 60,
            setMinLength: 3,
            setRequired: true,
            setLabel: emailModalConfig.setLabel,
            setPlaceholder: emailModalConfig.setPlaceholder,
            setStyle: emailModalConfig.setStyle === "paragraph" ? TextInputStyle.Paragraph : TextInputStyle.Short,
          }
        ])
      );

      interaction.client.cachedSplitVerificationData = {
        username,
        userId: interaction.user.id,
      };
    } catch (error) {
      console.error("Error showing email modal:", error);
      await interaction.reply({ content: "An error occurred. Please try again later.", ephemeral: true });
    }
  },
};

module.exports = alternative;