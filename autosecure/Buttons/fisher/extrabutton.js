const { TextInputStyle, EmbedBuilder } = require("discord.js");
const modalBuilder = require("../../utils/modalBuilder");
const { queryParams } = require("../../../db/database");
const getModal = require("../../utils/responses/getModal");
const getEmbed = require("../../utils/responses/getEmbed");

let extrabutton = {
  name: "extrabutton",
  callback: async (client, interaction) => {
    try {
      const embed = await getEmbed(client, "extrabutton");

      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error in extrabutton callback:", error);
    }
  },
};

module.exports = extrabutton;
