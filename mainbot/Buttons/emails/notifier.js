const { queryParams } = require("../../../db/database")
const emailMsg = require("../../utils/emails/emailMsg");

module.exports = {
    name: "notifier",
    callback: async (client, interaction) => {
        let [t, email, current] = interaction.customId.split("|")
        let isSubscribed = await queryParams(`SELECT * FROM email_notifier WHERE email=? AND user_id=?`, [email, interaction.user.id])
        if (isSubscribed.length == 0) {
            await queryParams(`INSERT INTO email_notifier(user_id,email) VALUES(?,?)`, [interaction.user.id, email])
            return interaction.update(await emailMsg(email, interaction.user.id, current))
        } else {
            await queryParams(`DELETE FROM email_notifier WHERE email=? AND user_id=?`, [email, interaction.user.id])
            return interaction.update(await emailMsg(email, interaction.user.id, current))
        }
    }
}