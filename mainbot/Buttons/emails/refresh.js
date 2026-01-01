const emailMsg = require("../../utils/emails/emailMsg");

module.exports = {
    name: "refresh",
    callback: async (client, interaction) => {
        let [t, email, page] = interaction.customId.split("|")
        return interaction.update(await emailMsg(email, interaction.user.id, page))
    }
}
