const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const appealmsg2 = require('../../../autosecure/utils/bancheckappeal/appealmsg2');

module.exports = {
    name: "appeal",
    userOnly: true,
    callback: async (client, interaction) => {
        const ssid = interaction.customid.split("|")[1]
        
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
    },
};