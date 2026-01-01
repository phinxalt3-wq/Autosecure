const getUnclaimedMessage = require("../../../autosecure/utils/embeds/unclaimedMessage");

module.exports = {
    name: "unclaimed_move",
    callback: async (client, interaction) => {
        let [t, page] = interaction.customId.split("|")
        return interaction.update(await getUnclaimedMessage(client, page))
    }
}