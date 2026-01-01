const modalBuilder = require('../../utils/modalBuilder')
const { TextInputStyle } = require("discord.js");

module.exports = {
    name: "claim",
    callback: async (client, interaction) => {
  interaction.showModal(modalBuilder(`claimmodal`, `Enter the right username of the account`, [{
   setCustomId: 'username',
   setMaxLength: 256,
   setMinLength: 0,
   setRequired: false,
   setLabel: "Minecraft Username | Entered Username",
   setPlaceholder: "Fill in any of above.",
   setStyle: TextInputStyle.Short
  }]))
 }
}
     

      