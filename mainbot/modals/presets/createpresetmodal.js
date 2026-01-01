const { EmbedBuilder } = require("discord.js");
const presetsmessage2 = require("../../../autosecure/utils/presets/presetsmessage2");
const { queryParams } = require("../../../db/database");

module.exports = {
  name: "createpresetmodal",
  editpresets: true,
  callback: async (client, interaction) => {
    let preset = interaction.fields.getTextInputValue("presetname");
    let [t, userid, botnumber, presetcount] = interaction.customId.split("|");

  //  console.log(`Preset: ${preset}`);

    try {

      let check = await queryParams(
        `SELECT * FROM presets WHERE user_id = ? AND botnumber = ? AND name = ?`,
        [userid, botnumber, preset]
      );

      if (check.length > 0) {
        return await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("This preset already exists, try editing it!")
              .setColor(0xADD8E6)
          ],
          ephemeral: true
        });
      }


      let msg = await presetsmessage2(preset, userid, botnumber, presetcount);
      await interaction.reply(msg);

    } catch (err) {
      console.error(err);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Failed to create preset!")
            .setColor(0xFF0000)
        ],
        ephemeral: true
      });
    }
  }
};
