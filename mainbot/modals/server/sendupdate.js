const { queryParams } = require("../../../db/database");
const { roleid } = require('../../../config.json'); // Make sure config.json has "roleid": "YOUR_ROLE_ID"

module.exports = {
    name: "sendupdate",
    callback: async (client, interaction) => {
        try {
            // Extract channel ID from custom ID (format: "sendupdate|CHANNEL_ID")
            const customIdParts = interaction.customId.split('|');
            if (customIdParts.length < 2) {
                return interaction.reply({
                    content: "Invalid interaction format. Channel ID missing.",
                    ephemeral: true
                });
            }
            
            const channelId = customIdParts[1];
            if (!channelId) {
                return interaction.reply({
                    content: "Channel ID is missing from the interaction.",
                    ephemeral: true
                });
            }

            const added = interaction.fields.getTextInputValue('added');
            const changed = interaction.fields.getTextInputValue('changed');

            // Format content with bullet points
            const formatContent = (text) => {
                return text.split('\n')
                    .filter(line => line.trim())
                    .map(line => line.startsWith('-') ? line : `- ${line}`)
                    .join('\n');
            };

            // Get and update version
            const versionQuery = await queryParams(
                `SELECT version FROM controlbot WHERE id=1`
            );
            let currentVersion = versionQuery[0]?.version || 1.0;
            const newVersion = Math.round((currentVersion + 0.1) * 10) / 10;
            
            await queryParams(
                `UPDATE controlbot SET version=? WHERE id=1`,
                [newVersion]
            );

            // Create and send embed with role ping
            const channel = await client.channels.fetch(channelId);
            if (!channel) {
                return interaction.reply({
                    content: "Could not find the specified channel.",
                    ephemeral: true
                });
            }

            await channel.send({
                content: `<@&${roleid}>`, // Role ping
                embeds: [{
                    title: `Autosecure has been updated!\nv${newVersion}`,
                    color: 13158600,
                    fields: [
                        {
                            name: "Added:",
                            value: formatContent(added) || "No new features added"
                        },
                        {
                            name: "Changed:",
                            value: formatContent(changed) || "No changes made"
                        }
                    ]
                }]
            });

            return interaction.reply({
                content: `Update sent to <#${channelId}> with role ping!`,
                ephemeral: true
            });

        } catch (error) {
            console.error("Error handling update:", error);
            let errorMessage = "Failed to process update. Please try again.";
            
            if (error.code === 50035) {
                errorMessage = "Invalid channel ID. Please report this issue.";
            } else if (error.code === 10003) {
                errorMessage = "Channel not found. It may have been deleted.";
            } else if (error.code === 10011) {
                errorMessage = "Role not found. Please check the role ID in config.";
            }
            
            return interaction.reply({
                content: errorMessage,
                ephemeral: true
            });
        }
    }
};