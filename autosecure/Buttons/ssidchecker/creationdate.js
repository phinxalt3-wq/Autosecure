const axios = require("axios");
const generate = require("../../utils/generate");
const { queryParams } = require("../../../db/database");
const { EmbedBuilder } = require("discord.js");

let changeskin = {
  name: `creationdate`,
  callback: async (client, interaction) => {
    try {
      let creationdate = interaction.customId.split("|")[1];


      const creationDate = new Date(creationdate);
      if (isNaN(creationDate.getTime())) throw new Error("Invalid date format");


      const formattedDate = `<t:${Math.floor(creationDate.getTime() / 1000)}:F>`;


      const embed = new EmbedBuilder()
        .setColor(0xb2c7e0)
        .addFields({
          name: 'Minecraft Creation Date [Own timezone]',
          value: formattedDate,
          inline: false
        });


      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    } catch (error) {
      console.error("Error processing creation date:", error);
      await interaction.reply({
        content: "An error occurred while processing the creation date.",
        ephemeral: true
      });
    }
  }
};

module.exports = changeskin;
