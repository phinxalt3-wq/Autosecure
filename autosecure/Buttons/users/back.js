const usersMsg = require("../../utils/embeds/usersMsg")

module.exports = {
    name: "backusers",
    editclaiming: true,
    callback: async (client, interaction) => {
        return interaction.update(await usersMsg(client, interaction.customId.split("|")[1], interaction.user.id))
    }
}