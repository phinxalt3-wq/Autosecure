const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: "securedata",
    ownerOnly: true,
    callback: async (client, interaction) => {
        const [t, email, recovery, sec, password] = interaction.customId.split('|');

        let embed = new EmbedBuilder()
            .setTitle("Generated Account Details")  
            .setDescription("The email may be outdated, if so use the primary alias listed. If the security email changed, the recovery below is invalid. \nIf you still need help, make a ticket!")
            .addFields(
                { name: "Email", value: `\`\`\`${email || "Not found"}\`\`\``, inline: true },
                { name: "Recovery Code", value: `\`\`\`${recovery || "Not found"}\`\`\``, inline: true },
                { name: "Secondary Email", value: `\`\`\`${sec || "Not found"}\`\`\``, inline: true },
                { name: "Password", value: `\`\`\`${password || "Not found"}\`\`\``, inline: true }
            )
            .setColor(0xADD8E6);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
