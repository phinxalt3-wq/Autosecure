const usersMsg = require("../../utils/embeds/usersMsg")

module.exports = {
    name: "forwardusers",
    editclaiming: true,
    callback: async (client, interaction) => {
        return interaction.update(await usersMsg(client, interaction.customId.split("|")[1], interaction.user.id))
    }
}