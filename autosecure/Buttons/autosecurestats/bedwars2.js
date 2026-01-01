const getUUID = require("../../utils/hypixelapi/getUUID");
const getStats = require('../../utils/hypixelapi/getStats');
const short = require("short-number");
const { EmbedBuilder } = require('discord.js');
const { getSkinAttachment } = require('../../utils/imageHandler');

module.exports = {
    name: "bedwars2",
    usestatsbutton: true,
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply({ ephemeral: true });

            let mcname = interaction.customId.split("|")[1];
            if (!mcname) {
                const noneEmbed = new EmbedBuilder()
                    .setTitle('Bedwars stats')
                    .setDescription('None')
                    .setColor("#D4B7D9");
                return interaction.editReply({ content: null, embeds: [noneEmbed] });
            }

            let stats = await getStats(mcname);
            if (!stats || !stats.bedwars) {
                const noneEmbed = new EmbedBuilder()
                    .setTitle('Bedwars stats')
                    .setDescription('None')
                    .setColor("#D4B7D9");
                return interaction.editReply({ content: null, embeds: [noneEmbed] });
            }
            let bedwars = stats.bedwars;

            let color = null;
            if (stats.color !== undefined && stats.color !== null && stats.color) {
                color = stats.color;
            }

            const output = `NWL: \`${stats.nwl || "N/A"}\` \n` +
                `\`[${bedwars.level || 0}✫]\` \`[${stats.rank || "None"}]\`` +
                (color ? ` \`${color}\`` : "") + `\n` +
                `\`•\`WLR: \`${bedwars.wlr || 0}\` (Wins: \`${bedwars.wins || 0}\`, Losses: \`${bedwars.losses || 0}\`)\n` +
                `\`•\`FKDR: \`${bedwars.fkdr || 0}\` (Final Kills: \`${bedwars.finalKills || 0}\`, Final Deaths: \`${bedwars.finalDeaths || 0}\`)\n` +
                `\`•\`BBLR: \`${bedwars.bblr || 0}\` (Beds Broken: \`${bedwars.bedsBroken || 0}\`, Beds Lost: \`${bedwars.bedsLost || 0}\`)`;

            console.log(`[BEDWARS_STATS] Generating stats embed for ${mcname}`);
            const skinAttachment = await getSkinAttachment(mcname);
            
            const embed = new EmbedBuilder()
                .setAuthor({ name: `${mcname} | Bedwars Stats` })
                .setDescription(output)
                .setColor("#D4B7D9");

            // Only add thumbnail and files if skinAttachment is valid
            if (skinAttachment && skinAttachment.name) {
                embed.setThumbnail('attachment://' + skinAttachment.name);
            }

            const replyOptions = {
                content: null, 
                embeds: [embed]
            };

            if (skinAttachment) {
                replyOptions.files = [skinAttachment];
            }

            console.log(`[BEDWARS_STATS] Sending stats embed for ${mcname}`);
            await interaction.editReply(replyOptions);

        } catch (error) {
            console.error("Error in bedwars2 command:", error);
            const noneEmbed = new EmbedBuilder()
                .setTitle('Bedwars stats')
                .setDescription('None')
                .setColor("#D4B7D9");
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: null, embeds: [noneEmbed] });
            } else {
                await interaction.reply({ content: 'None', ephemeral: true });
            }
        }
    }
};
