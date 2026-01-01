const { PermissionsBitField } = require('discord.js');
const config = require('../../../config.json'); // Ensure this contains guildid

module.exports = {
    name: "ban",
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

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                return await interaction.reply({ 
                    content: "❌ You don't have permission to ban members!", 
                    ephemeral: true 
                });
            }

            await member.ban({ reason: `Banned by ${interaction.user.tag}` });
            
            await interaction.reply({ 
                content: `✅ Successfully banned <@${userId}>!`, 
                ephemeral: false 
            });

        } catch (error) {
            console.error("Ban Error:", error);
            await interaction.reply({ 
                content: "❌ Failed to ban the user.", 
                ephemeral: true 
            });
        }
    }
};
