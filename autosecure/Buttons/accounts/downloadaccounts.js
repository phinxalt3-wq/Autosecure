const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "downloadaccounts",
    callback: async (client, interaction) => {
        const embed = new EmbedBuilder()
            .setTitle("Download")
            .setColor(0xADD8E6);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`massdownload|recovery|${interaction.user.id}`)
                .setLabel("Email & Recovery")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId(`massdownload|secretkey|${interaction.user.id}`)
                .setLabel("Email & Pass & Secretkey")
                .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
                .setCustomId(`massdownload|usernames|${interaction.user.id}`)
                .setLabel("Usernames")
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
};
