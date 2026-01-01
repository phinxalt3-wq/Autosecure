const { sendclaimownerembed } = require("../../../mainbot/utils/usernotifications")

module.exports = {
    name: "moveunclaimed",
    userOnly: true,
    callback: async (client, interaction) => {
        return interaction.update(await sendclaimownerembed(client, interaction.customId.split("|")[1]))
    }
}