const { TextInputBuilder, ActionRowBuilder, TextInputStyle } = require("discord.js");

const emailMsg = require("../../utils/emails/emailMsg");
const modalBuilder = require('../../utils/modalBuilder')

module.exports = {
    name: "currentacc",
    callback: async (client, interaction) => {
        const [t, email] = interaction.customId.split("|");
  interaction.showModal(modalBuilder(`currentaccmodal`, `Enter a page number to move to`, [{
   setCustomId: 'currentmodal',
   setMaxLength: 256,
   setMinLength: 0,
   setRequired: false,
   setLabel: "Navigate to:",
   setPlaceholder: "Page number",
   setStyle: TextInputStyle.Short
  }]))
 }
}
     

      