const getUUID = require("../../utils/hypixelapi/getUUID");
const short = require("short-number");
const getStats = require('../../utils/hypixelapi/getStats');
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "duels2",
  usestatsbutton: true,
  callback: async (client, interaction) => {
    let mcname = interaction.customId.split("|")[1];
    let uuid = getUUID(mcname);
    if (!uuid) {
      return sendNone(interaction);
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const stats = await getStats(mcname);
      const duelsStats = stats?.duels || {};

      const calculatedStats = {
        nwl: stats.nwl || 0,
        rank: stats.rank || "None",
        wins: duelsStats.wins || 0,
        losses: duelsStats.losses || 0,
        kills: duelsStats.kills || 0,
        deaths: duelsStats.deaths || 0,
        coins: duelsStats.coins || 0,
        gamesPlayed: duelsStats.totalGamesPlayed || 0,
        title: duelsStats.title || "No Rank",
        wlr: duelsStats.WLRatio || "0.00",
        klr: duelsStats.KLRatio || "0.00",
      };

      const description =
        `NWL: \`${calculatedStats.nwl}\`\n` +
        `Division: [\`${calculatedStats.title}\`] | [\`${calculatedStats.rank}\`]\n` +
        `\`•\` WLR: \`${calculatedStats.wlr}\` (Wins: \`${calculatedStats.wins}\`, Losses: \`${calculatedStats.losses}\`)\n` +
        `\`•\` KDR: \`${calculatedStats.klr}\` (Kills: \`${calculatedStats.kills}\`, Deaths: \`${calculatedStats.deaths}\`)\n` +
        `\`•\` Coins: \`${short(calculatedStats.coins)}\` (Games Played: \`${calculatedStats.gamesPlayed}\`)`;

      const embed = new EmbedBuilder()
        .setTitle("Duels stats")
        .setDescription(description)
        .setColor("#D4B7D9");

      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error("Error fetching duels stats:", error);
      return sendNone(interaction);
    }
  },
};

async function sendNone(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const embed = new EmbedBuilder()
    .setTitle("Duels stats")
    .setDescription("None")
    .setColor("#D4B7D9");

  try {
    await interaction.editReply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error("Error sending 'None' embed:", error);
    return interaction.followUp({ content: "Error sending message.", ephemeral: true });
  }
}
