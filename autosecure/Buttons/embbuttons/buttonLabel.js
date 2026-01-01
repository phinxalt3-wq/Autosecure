const { TextInputStyle } = require("discord.js")
const modalBuilder = require("../../utils/modalBuilder")
const generate = require("../../utils/generate")
const { queryParams } = require('../../../db/database')

module.exports = {
  name: "buttonlabel",
  callback: (client, interaction) => {
    const type = interaction.customId.split("|")[1]
    let rId = generate(32)
    client.queryParams(`INSERT INTO actions (id, action) VALUES (?, ?)`, [rId, `buttonlabel|${type}`])
    
    interaction.showModal(modalBuilder(`action|${rId}`, `Button Label`, [{
      setCustomId: 'buttonlabel',
      setMaxLength: 80,
      setMinLength: 0,
      setRequired: false,
      setLabel: "Button Label",
      setPlaceholder: "Put your desired button label",
      setStyle: TextInputStyle.Short
    }]))
  }
}