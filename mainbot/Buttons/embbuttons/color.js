const { TextInputStyle } = require("discord.js");
const modalBuilder = require("../../utils/modalBuilder");

module.exports = {
  name: "color",
  callback: (client, interaction) => {
    interaction.showModal(modalBuilder(`color`, `Color Picker`, [{
      setCustomId: 'color',
      setMaxLength: 30, // Increased to support longer color formats
      setMinLength: 1,
      setRequired: true,
      setLabel: "Color",
      setPlaceholder: "Enter a hex (#594166) or a name (green)",
      setStyle: TextInputStyle.Short
    }]));
  }
};