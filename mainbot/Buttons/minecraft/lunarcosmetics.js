const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: "lunarcosmetics",
  userOnly: true,
  callback: async (client, interaction) => {
    let uid = interaction.customId.split("|")[1];
    let lunarResult = await client.queryParams(`SELECT lunar FROM extrainformation WHERE uid=?`, [uid]);
    let lunar = JSON.parse(lunarResult[0].lunar || "{}");

    const embed = new EmbedBuilder()
      .setColor('#87CEEB')
      .setTitle(`Lunar Cosmetics for UID: ${uid}`)

    if (lunar.cosamount) {
      embed.addFields({ name: "Total Cosmetics", value: `${lunar.cosamount}`, inline: false });
    } else {
      embed.addFields({ name: "Total Cosmetics", value: "0", inline: false });
    }

    embed.addFields({
      name: "Cosmetics List",
      value: lunar.cosmetics ? lunar.cosmetics : "No cosmetics found.",
      inline: false
    });

    return interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
