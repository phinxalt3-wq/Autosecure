const { TextInputStyle } = require("discord.js")
const modalBuilder = require("../../utils/modalBuilder")
const generate = require("../../utils/generate")
const { queryParams } = require('../../../db/database')

module.exports = {
  name: "buttonemoji",
  callback: (client, interaction) => {
    const type = interaction.customId.split("|")[1]
    let rId = generate(32)
    client.queryParams(`INSERT INTO actions (id, action) VALUES (?, ?)`, [rId, `buttonemoji|${type}`])
    
    interaction.showModal(modalBuilder(`action|${rId}`, `Button Emoji`, [
      {
        setCustomId: 'emoji_input',
        setMaxLength: 100,
        setMinLength: 0,
        setRequired: false,
        setLabel: "Unicode / Emoji ID / :name:",
        setPlaceholder: "",
        setStyle: TextInputStyle.Short
      }
    ]))
  }
}