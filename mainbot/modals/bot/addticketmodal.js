const { PermissionsBitField, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "addtoticketmodal",
    ownerOnly: true,
    callback: async (client, interaction) => {
        const userid = interaction.components[0].components[0].value;
        const channel = interaction.channel;

        try {
            // Get current permissions for the user
            const existingPermissions = channel.permissionOverwrites.cache.get(userid);
            
            // Check if user already has SendMessages permission
            if (existingPermissions && existingPermissions.allow.has(PermissionsBitField.Flags.SendMessages)) {
                return await interaction.reply({
                    content: `<@${userid}> is already added to the ticket.`,
                    ephemeral: true
                });
            }

            // Add the user if they're not already added
            await channel.permissionOverwrites.edit(userid, {
                ViewChannel: true,
                SendMessages: true,
                AttachFiles: true
            });

            await interaction.reply({
                content: `<@${userid}> has been added to the ticket.`,
                ephemeral: true
            });

            const embed = new EmbedBuilder()
                .setTitle("New user added!")
                .setDescription(`<@${userid}> has been added to this ticket.`)
                .setColor(11393286)
                .setTimestamp();

            await channel.send({ embeds: [embed] });

        } catch (error) {
            console.error("Failed to add user to the ticket:", error);
            await interaction.reply({
                content: "There was an error adding the user to the ticket. Make sure the ID is valid.",
                ephemeral: true
            });
        }
    }
}