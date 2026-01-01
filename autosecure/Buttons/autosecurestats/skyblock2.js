const shorten = require("short-number");
const getUUID = require("../../utils/hypixelapi/getUUID");
const getStats = require('../../utils/hypixelapi/getStats');
const { EmbedBuilder } = require('discord.js');
const { formatDistanceToNow } = require('date-fns');

const safeShort = (n) => {
  const num = typeof n === "number" ? n : Number(n);
  if (isNaN(num)) return "0";
  return shorten(num);
};

module.exports = {
    name: "skyblock2",
    usestatsbutton: true,
    callback: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });
        
        try {
            let mcname = interaction.customId.split("|")[1];
            let uuid = await getUUID(mcname);
            if (!uuid) {
                await sendNone(interaction);
                return;
            }

            const stats = await getStats(mcname);
            console.log(`Stats from skyblock2: ${JSON.stringify(stats)}`)
            if (!stats?.skyblock) {
                await sendNone(interaction);
                return;
            }

            const skyblockProfile = stats.skyblock.find(prof => prof.current === true);
            if (!skyblockProfile) {
                await sendNone(interaction);
                return;
            }

            // Format all the data
            const profileName = skyblockProfile.name || "Unknown";
            const gameMode = skyblockProfile.gameMode || "Standard";
            const memberCount = skyblockProfile.members?.length || 1;
            const profileType = memberCount === 1 ? "Solo profile" : `Coop (${memberCount} members)`;
            const networth = safeShort(skyblockProfile.networth || 0);
            const unsoulbound = safeShort(skyblockProfile.unsoulboundNetworth || 0);
            const liquid = safeShort(skyblockProfile.liquid || 0);
            const soulbound = safeShort((skyblockProfile.networth || 0) - (skyblockProfile.unsoulboundNetworth || 0));
            const cataLevel = skyblockProfile.catacombs?.level || "Not entered";
            const hotmLevel = skyblockProfile.mining?.hotm?.level || 0;
            const mithril = safeShort(skyblockProfile.mining?.mithrilPowder || 0);
            const gemstone = safeShort(skyblockProfile.mining?.gemstonePowder || 0);
            const minionSlots = skyblockProfile.minionSlots || 5;
let craftedMinions = skyblockProfile.craftedMinions || 0;
if (craftedMinions >= 686) craftedMinions = 686;
const uniqueMinions = `${craftedMinions}/686`;
            const sbLevel = skyblockProfile.levels || "0";
            const glacitepowder = safeShort(skyblockProfile?.mining?.glacite || 0);
            
            // Handle skill average safely
            let skillAvg = "0.0~";
            if (skyblockProfile.skills?.avg) {
                const avgNum = parseFloat(skyblockProfile.skills.avg);
                if (!isNaN(avgNum)) {
                    skillAvg = avgNum.toFixed(1) + "~";
                }
            }

            const slayers = [
                skyblockProfile.slayers?.zombie || 0,
                skyblockProfile.slayers?.wolf || 0,
                skyblockProfile.slayers?.spider || 0,
                skyblockProfile.slayers?.enderman || 0,
                skyblockProfile.slayers?.blaze || 0,
                skyblockProfile.slayers?.vampire || 0
            ].join(" | ");

            // Format member information
            let membersDescription = "";
            if (memberCount > 1 && skyblockProfile.members) {
                membersDescription = `**Members** (${memberCount}):\n`;
                let memberIndex = 1;
                for (const member of skyblockProfile.members) {
                    if (member.uuid !== uuid) { // Skip the profile owner
                        const joinDate = member.joined ? new Date(member.joined) : null;
                        const timeAgo = joinDate ? formatDistanceToNow(joinDate, { addSuffix: true }) : "Unknown";
                        const memberName = member.name || "Unknown";
                        const kickStatus = member.kickable ? "✅" : "❌";
                        
                        membersDescription += `${memberIndex}│ \`${memberName}\` - ${timeAgo} - Kick: ${kickStatus}\n`;
                        memberIndex++;
                    }
                }
            }

            // Create embed with fields
            const embed = new EmbedBuilder()
                .setTitle(`Skyblock stats | ${profileName} | ${gameMode}`)
                .setDescription(membersDescription || profileType)
                .setColor("#D4B7D9")
                .addFields(
                    {
                        name: '💰 Networth',
                        value: `**${networth}**\nUnsoulbound: ${unsoulbound}\nSoulbound: ${soulbound}\nLiquid: ${liquid}`,
                        inline: true
                    },
                    {
                        name: '⛓️ Dungeons',
                        value: `Cata: ${cataLevel}\nHealer: ${skyblockProfile.catacombs?.healer || "None"}\nMage: ${skyblockProfile.catacombs?.mage || "None"}\nBerserk: ${skyblockProfile.catacombs?.berserk || "None"}\nArcher: ${skyblockProfile.catacombs?.archer || "None"}\nTank: ${skyblockProfile.catacombs?.tank || "None"}`,
                        inline: true
                    },
                    {
                        name: '🏔️ Mining',
                        value: `HOTM: ${hotmLevel}\nMithril: ${mithril}\nGemstone: ${gemstone}\nGlacite: ${glacitepowder}`,
                        inline: true
                    },
                    {
                        name: '👨🏿🦲 Minions',
                        value: `Slots: ${minionSlots}\nUnique: ${uniqueMinions}`,
                        inline: true
                    },
                    {
                        name: '🗡️ Slayers',
                        value: slayers,
                        inline: true
                    },
                    {
                        name: '📈 Skyblock Level',
                        value: `Level: ${sbLevel}`,
                        inline: true
                    },
                    {
                        name: 'Skills',
                        value: `Mining: ${skyblockProfile.skills?.Mining || "None"}\nTaming: ${skyblockProfile.skills?.Taming || "None"}\nAlchemy: ${skyblockProfile.skills?.Alchemy || "None"}\nRunecrafting: ${skyblockProfile.skills?.Runecrafting || "None"}`,
                        inline: true
                    },
                    {
                        name: 'Average',
                        value: `${skillAvg}\nFarming: ${skyblockProfile.skills?.Farming || "None"}\nCombat: ${skyblockProfile.skills?.Combat || "None"}\nForaging: ${skyblockProfile.skills?.Foraging || "None"}`,
                        inline: true
                    },
                    {
                        name: '\u200b',
                        value: `Enchanting: ${skyblockProfile.skills?.Enchanting || "None"}\nFishing: ${skyblockProfile.skills?.Fishing || "None"}\nCarpentry: ${skyblockProfile.skills?.Carpentry || "None"}\nSocial: ${skyblockProfile.skills?.Social || "None"}`,
                        inline: true
                    }
                );

            await interaction.editReply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error("Error updating message:", error);
            await sendNone(interaction);
        }
    }
};

async function sendNone(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('Skyblock Stats')
        .setDescription('No SkyBlock data found')
        .setColor('#FF0000');

    try {
        await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
        console.error("Error sending 'None' message:", error);
        await interaction.followUp({ content: "Error retrieving SkyBlock data.", ephemeral: true });
    }
}