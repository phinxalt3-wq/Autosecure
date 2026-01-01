const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "modal",
  editmodals: true,
  callback: async (client, interaction) => {
    const type = interaction.customId.split("|")[1];
    const botnumber = interaction.customId.split("|")[2];
    const ownerid = interaction.customId.split("|")[3];

    await interaction.reply({
      embeds: [{
        title: `Editing Modal: ${type}. It's saved automatically.`,
        color: 0xC8C8C8
      }],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`editTitle|${type}|${botnumber}|${ownerid}`)
            .setLabel("Edit Title")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`editLabel|${type}|${botnumber}|${ownerid}`)
            .setLabel("Edit Label")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`editPlaceholder|${type}|${botnumber}|${ownerid}`)
            .setLabel("Edit Placeholder")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`editStyle|${type}|${botnumber}|${ownerid}`)
            .setLabel("Edit Style")
            .setStyle(ButtonStyle.Secondary)
        ),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`exampleModal|${type}|${botnumber}|${ownerid}`)
            .setLabel("Example")
            .setStyle(ButtonStyle.Primary)
        )
      ],
      ephemeral: true,
    });
  },
};
