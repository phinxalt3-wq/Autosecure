const { queryParams } = require("../../../db/database");
const { autosecureMap } = require("../../handlers/botHandler");

module.exports = {
    name: "notify",
    ownerOnly: true,
    description: "Notify users when server is lost",
    options: [{
        name: "message",
        description: "Message you want to notify people with",
        type: 3,
        required: true
    }],
    callback: async (client, interaction) => {
        try {
            const message = interaction.options.getString("message");
            await interaction.deferReply({ ephemeral: true });

            const results = await queryParams('SELECT user_id, hits_channel, logs_channel, notification_channel FROM autosecure');

            let successCount = 0;
            let failCount = 0;

            for (const result of results) {
                if (!result.hits_channel || !result.hits_channel.includes('|')) {
                    failCount++;
                    continue;
                }

                const [channelId, guildId] = result.hits_channel.split('|');
                const userId = result.user_id;
                const autosecureClient = autosecureMap.get(userId);

                if (!autosecureClient) {
                    failCount++;
                    continue;
                }

                try {
                    const guild = autosecureClient.guilds.cache.get(guildId);
                    if (!guild) {
                        failCount++;
                        continue;
                    }

                    const channel = guild.channels.cache.get(channelId);
                    if (!channel || !channel.isTextBased()) {
                        failCount++;
                        continue;
                    }

                    await channel.send(message);

                    if (result.logs_channel && result.logs_channel.includes('|')) {
                        const [logsChannelId, logsGuildId] = result.logs_channel.split('|');
                        const logsGuild = autosecureClient.guilds.cache.get(logsGuildId);
                        if (logsGuild) {
                            const logsChannel = logsGuild.channels.cache.get(logsChannelId);
                            if (logsChannel && logsChannel.isTextBased()) {
                                await logsChannel.send(message);
                            }
                        }
                    }

                    if (result.notification_channel && result.notification_channel.includes('|')) {
                        const [notifChannelId, notifGuildId] = result.notification_channel.split('|');
                        const notifGuild = autosecureClient.guilds.cache.get(notifGuildId);
                        if (notifGuild) {
                            const notifChannel = notifGuild.channels.cache.get(notifChannelId);
                            if (notifChannel && notifChannel.isTextBased()) {
                                await notifChannel.send(message);
                            }
                        }
                    }

                    successCount++;
                } catch (err) {
                    console.error(`Failed to send message for user ${userId}:`, err);
                    failCount++;
                }
            }

            await interaction.editReply({
                content: `Message sent to ${successCount} channels. ${failCount > 0 ? `Failed for ${failCount} channels.` : ''}`,
                ephemeral: true
            });
        } catch (error) {
            console.error("Error sending notifications:", error);
            await interaction.editReply({
                content: "An error occurred while sending the notifications.",
                ephemeral: true
            });
        }
    }
};
