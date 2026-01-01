const { EmbedBuilder } = require('discord.js');
const getcosmetics = require('../../utils/cosmetics/getcosmetics');

module.exports = {
  name: "labymod",
  ownerOnly: true,
  callback: async (client, interaction) => {
    let uid = interaction.customId.split("|")[1];
    let username = await client.queryParams(`SELECT username FROM extrainformation WHERE uid=?`, [uid]);
    username = username[0].username;

    let laby = await getcosmetics(username);

    let description = `**Amount:** ${laby.amount}\n\n`;

    if (laby.amount && laby.data) {
      let cosmetics = JSON.parse(laby.data);
      for (let item of cosmetics) {
        let line = `${item}\n`;
        if (description.length + line.length > 4000) break;
        description += line;
      }
    } else {
      description += "No cosmetics found.";
    }

    let embed = new EmbedBuilder()
      .setTitle("Labymod Cosmetics")
      .setDescription(description);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
