const { PermissionsBitField } = require('discord.js');
const config = require('../../../config.json'); // Ensure this contains guildid

module.exports = {
    name: "kick",
    ownerOnly: true,
    callback: async (client, interaction) => {
        try {
            const [_, userId] = interaction.customId.split("|");

            const guild = await client.guilds.fetch(config.guildid);
            if (!guild) {
                return await interaction.reply({ 
                    content: "❌ Guild not found!", 
                    ephemeral: true 
                });
            }

            const member = await guild.members.fetch(userId).catch(() => null);
            if (!member) {
                return await interaction.reply({ 
                    content: "❌ User not found in the guild!", 
                    ephemeral: true 
                });
            }

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                return await interaction.reply({ 
                    content: "❌ You don't have permission to kick members!", 
                    ephemeral: true 
                });
            }

            await member.kick(`Kicked by ${interaction.user.tag}`);
            
            await interaction.reply({ 
                content: `✅ Successfully kicked <@${userId}>!`, 
                ephemeral: false 
            });

        } catch (error) {
            console.error("Kick Error:", error);
            await interaction.reply({ 
                content: "❌ Failed to kick the user.", 
                ephemeral: true 
            });
        }
    }
};
