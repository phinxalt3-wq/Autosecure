const { queryParams } = require("../../../db/database")
const listProfiles = require("../../utils/hypixelapi/listProfiles")

module.exports = {
    name: "deleteprofile",
    callback: async (client, interaction) => {
        let id = interaction.customId.split("|")[1]
        await client.queryParams(`DELETE FROM profiles WHERE id=? AND user_id=?`, [id, interaction.user.id])
        return interaction.update(await listProfiles(interaction.user.id, 1))
    }
}