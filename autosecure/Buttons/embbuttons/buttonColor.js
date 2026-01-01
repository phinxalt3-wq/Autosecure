const { TextInputStyle } = require("discord.js")
const modalBuilder = require("../../utils/modalBuilder")
const generate = require("../../utils/generate")
const { queryParams } = require('../../../db/database')

module.exports = {
  name: "buttoncolor",
  callback: (client, interaction) => {
    const type = interaction.customId.split("|")[1]
    let rId = generate(32)
    client.queryParams(`INSERT INTO actions (id, action) VALUES (?, ?)`, [rId, `buttoncolor|${type}`])
    
    interaction.showModal(modalBuilder(`action|${rId}`, `Button Color`, [{
      setCustomId: 'buttoncolor',
      setMaxLength: 5,
      setMinLength: 3,
      setRequired: true,
      setLabel: "Button Color",
      setPlaceholder: "Only 4 options (Red,Green,Blue,Gray)",
      setStyle: TextInputStyle.Short
    }]))
  }
}