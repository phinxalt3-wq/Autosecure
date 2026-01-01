const { TextInputStyle } = require("discord.js")
const modalBuilder = require("../../utils/modalBuilder")
const generate = require("../../utils/generate")
const { queryParams } = require('../../../db/database')

module.exports = {
 name: "embedjson",
 callback: (client, interaction) => {
    let type = interaction.customId.split("|").slice(1).join("|");
    let rId = generate(32);
    client.queryParams(`INSERT INTO actions (id, action) VALUES (?, ?)`, [rId, `embedjson|${type}`]);
  interaction.showModal(modalBuilder(`action|${rId}`, `Embed | .json format`, [{
   setCustomId: 'json',
   setMaxLength: 4000,
   setMinLength: 1,
   setRequired: true,
   setLabel: "Enter JSON format embed",
   setPlaceholder: "Use discohook.org for example",
   setStyle: TextInputStyle.Paragraph
  }]))
 }
}