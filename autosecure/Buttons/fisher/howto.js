const getEmbed = require("../../utils/responses/getEmbed");

let howto = {
  name: "howto",
  callback: async (client, interaction) => {
    try {
      const embed = await getEmbed(client, "howto");

      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error sending embed:", error);
      await interaction.reply({
        content: "There was an error fetching the embed.",
        ephemeral: true,
      });
    }
  },
};

module.exports = howto;
