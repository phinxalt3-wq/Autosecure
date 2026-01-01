const getUUID = require("../../utils/hypixelapi/getUUID");
const getStats = require('../../utils/hypixelapi/getStats');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: "skywars2",
    usestatsbutton: true,
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply({ ephemeral: true });

            let mcname = interaction.customId.split("|")[1];
            if (!mcname) {
                return sendNone(interaction);
            }

            let stats = await getStats(mcname);
            if (!stats || !stats.skywars) {
                return sendNone(interaction);
            }
            let skywarsStats = stats.skywars;

            const calculatedStats = {
                nwl: stats.nwl || 0,
                rank: stats.rank || "None",
                wins: skywarsStats.wins || 0,
                losses: skywarsStats.losses || 0,
                kills: skywarsStats.kills || 0,
                deaths: skywarsStats.deaths || 0,
                assists: skywarsStats.assists || 0,
                level: skywarsStats.levels || 0,
                wlr: skywarsStats.wlr || "0.00",
                kdr: skywarsStats.kdr || "0.00"
            };

            const output = 
                `NWL: \`${stats.nwl || "N/A"}\`\n` +
                `[\`${calculatedStats.level || 0}✫\`] | [\`${stats.rank || "None"}\`]\n` +
                `\`•\` WLR: \`${calculatedStats.wlr}\` (Wins: \`${calculatedStats.wins}\`, Losses: \`${calculatedStats.losses}\`)\n` +
                `\`•\` KDR: \`${calculatedStats.kdr}\` (Kills: \`${calculatedStats.kills}\`, Deaths: \`${calculatedStats.deaths}\`)\n` +
                `\`•\` Assists: \`${calculatedStats.assists}\``;

            const embed = new EmbedBuilder()
                .setTitle('SkyWars stats')
                .setDescription(output)
                .setColor("#D4B7D9");

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Error in skywars2 command:", error);
            await sendNone(interaction);
        }
    }
};

async function sendNone(interaction) {
    try {
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('SkyWars stats')
            .setDescription('None')
            .setColor("#D4B7D9");

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error("Error updating message with 'None':", error);
        if (!interaction.replied && !interaction.deferred) {
            return interaction.reply({ content: "Error updating message.", ephemeral: true });
        }
    }
}
