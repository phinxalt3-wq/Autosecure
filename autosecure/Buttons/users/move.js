const usersMsg = require("../../utils/embeds/usersMsg")

module.exports = {
    name: "moveusers",
    editclaiming: true,
    callback: async (client, interaction) => {
        console.log(`${interaction.customId}`)
        return interaction.update(await usersMsg(interaction.customId.split("|")[2], interaction.customId.split("|")[1], interaction.user.id, interaction.customId.split("|")[3]))
    }
}