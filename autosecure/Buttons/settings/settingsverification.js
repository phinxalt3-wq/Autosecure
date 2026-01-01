const listSettings = require("../../utils/settings/listSettings")

module.exports = {
    name: "settingsverification",
    editsettings: true,
    callback: async (client, interaction) => {
        let [t, verificationtype] = interaction.customId.split("|")
        verificationtype = parseInt(verificationtype)

        if (isNaN(verificationtype) || (verificationtype !== 0 && verificationtype !== 1)) {
            return interaction.reply({ content: "Invalid choice.", ephemeral: true })
        }


        await client.queryParams(
            `UPDATE autosecure SET verification_type = ? WHERE user_id = ?`,
            [verificationtype, client.username]
        )

        let msg = await listSettings(client, client.username, false)
        await interaction.update(msg)
    }
}
