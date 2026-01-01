const editpresetsmsg = require("../../../autosecure/utils/embeds/editpresetsmsg");
const presetsmessage2 = require("../../../autosecure/utils/presets/presetsmessage2");
const { queryParams } = require("../../../db/database");

module.exports = {
  name: "editpresetmodal",
  editpresets: true,
  callback: async (client, interaction) => {
    let preset = interaction.fields.getTextInputValue("presetname");
    let [t, userid, botnumber, page, number] = interaction.customId.split("|");
    number = number - 1
    // console.log(`Preset: ${preset}`);
    // console.log(`Botnumber: ${botnumber} | ownerid: ${userid} | name: ${preset}`);

    let msgnotexist = await editpresetsmsg(botnumber, userid, page);

    let checked = await queryParams(
      `SELECT * FROM presets WHERE user_id=? AND botnumber=? AND name=?`,
      [userid, botnumber, preset]
    );

    if (!checked || checked.length === 0) {
      msgnotexist.content = `Couldn't find this preset to edit!`;
      await interaction.reply(msgnotexist);
      return;
    }

    let msg = await presetsmessage2(preset, userid, botnumber, number);
    await interaction.reply(msg);
  },
};
