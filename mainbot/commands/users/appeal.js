const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const appealmsg2 = require('../../../autosecure/utils/bancheckappeal/appealmsg2');

module.exports = {
    name: "appeal",
    description: 'Autoappeal Hypixel Security Ban',
    enabled: true,
    options: [
        {
            name: "ssid",
            description: "SSID to autoappeal", 
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    userOnly: true,
    callback: async (client, interaction) => {
        const ssid = interaction.options.getString("ssid");
        await interaction.deferReply({ ephemeral: true });
        
        try {
            const msg = await appealmsg2(interaction.user.id, ssid);
            await interaction.editReply(msg);
        } catch (err) {
            console.error(err);
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("❌ Appeal Error")
                        .setDescription("An error occurred while processing your appeal request.")
                        .setColor(0xff4757)
                        .setThumbnail('https://cdn.pfps.gg/pfps/59339-erwan-meunier.gif')
                        .addFields({
                            name: '🔧 Error Details',
                            value: 'Report this as ID: `appeal1`',
                            inline: false
                        })
                        .addFields({
                            name: '💡 What to do?',
                            value: '• Try again in a few moments\n• Contact support if the issue persists\n• Make sure your SSID is valid',
                            inline: false
                        })
                        .setFooter({ text: 'Appeal System • Autosecure' })
                        .setTimestamp()
                ],
                ephemeral: true
            });
        }
    }
};
