const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const appealmsg2 = require('../../utils/bancheckappeal/appealmsg2');

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
                        .setTitle("Error. Report this as ID: appeal1")
                        .setColor("RED")
                ],
                ephemeral: true
            });
        }
    }
};
