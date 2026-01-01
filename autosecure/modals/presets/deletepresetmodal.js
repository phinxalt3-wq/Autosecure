const editpresetsmsg = require("../../../autosecure/utils/embeds/editpresetsmsg");
const { queryParams } = require("../../../db/database");

module.exports = {
  name: "deletepresetmodal",
  editpresets: true,
  callback: async (client, interaction) => {
    const preset = interaction.fields.getTextInputValue("presetname");
    const [t, userid, botnumber, page] = interaction.customId.split("|");

    try {

      let msg = await editpresetsmsg(botnumber, userid, page);

  
      const results = await queryParams(
        `SELECT preset FROM presets WHERE user_id = ? AND botnumber = ? AND name = ?`,
        [userid, Number(botnumber), preset]
      );

      if (results.length === 0) {
        msg.content = "❌ Couldn't find this preset";
        await interaction.reply(msg);
        return;
      }

      await queryParams(
        `DELETE FROM presets WHERE user_id = ? AND botnumber = ? AND name = ?`,
        [userid, Number(botnumber), preset],
        "run"  
      );


      msg = await editpresetsmsg(botnumber, userid, page);
      msg.content = "✅ Preset deleted successfully";
      await interaction.reply(msg);

    } catch (error) {
      console.error("Error handling preset:", error);

      const errorMsg = await editpresetsmsg(botnumber, userid, page);
      errorMsg.content = "⚠️ An error occurred while processing your request";
      await interaction.reply(errorMsg);
    }
  }
};