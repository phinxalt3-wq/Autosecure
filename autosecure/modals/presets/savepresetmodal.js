const { queryParams } = require("../../../db/database");
const editpresetsmsg = require("../../../autosecure/utils/embeds/editpresetsmsg");
const { isUrl, codeblock } = require("../../../autosecure/utils/process/helpers");
const presetsmessage2 = require("../../../autosecure/utils/presets/presetsmessage2");

module.exports = {
  name: "savepresetmodal",
  editpresets: true,
  callback: async (client, interaction) => {
    let embed = interaction.message.embeds[0].data;
    let [t, name, ownerid, botnumber, number] = interaction.customId.split("|");

    let linklabel = interaction.fields.getTextInputValue("linklabel").trim() || null;
    let linkurl = interaction.fields.getTextInputValue("linkurl").trim() || null;

    let timestamp = Date.now();
    let presetCount = parseInt(number) + 1;
    let page = Math.ceil(presetCount / 10);

           await interaction.deferUpdate();

    if ((linkurl && !linklabel) || (!linkurl && linklabel)) {      
      let msg = await presetsmessage2(name, ownerid, botnumber, number)
      msg.content = `Couldn't save **${name}**. Please enter both the Link (Label & URL)`
      return interaction.editReply(msg)
    }

    // URL validation
    if (linkurl && !isUrl(linkurl)) {
      let msg = await presetsmessage2(name, ownerid, botnumber, number)
      msg.content = `❌ Couldn't save **${name}**, invalid URL: **${linkurl}**`;
      return interaction.editReply(msg);
    }

    // Check if preset already exists
    let d = await queryParams(
      `SELECT * FROM presets WHERE user_id=? AND name=? AND botnumber=? LIMIT 1`,
      [ownerid, name, botnumber]
    );

    if (d.length === 0) {
      // Insert new preset
      await queryParams(
        `INSERT INTO presets (user_id, name, preset, botnumber, buttonlabel, buttonlink, time) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [ownerid, name, JSON.stringify(embed), botnumber, linklabel, linkurl, timestamp]
      );
      let msg = await editpresetsmsg(botnumber, ownerid, page);
      msg.content = `✅ Saved your preset **${name}**!`;
      return interaction.editReply(msg);
    } else {
      // Update existing preset
      await queryParams(
        `UPDATE presets SET preset=?, buttonlabel=?, buttonlink=?, time=? WHERE user_id=? AND name=? AND botnumber=?`,
        [JSON.stringify(embed), linklabel, linkurl, timestamp, ownerid, name, botnumber]
      );
      let msg = await editpresetsmsg(botnumber, ownerid, page);
      msg.content = `✅ Updated your preset **${name}**!`;
      return interaction.editReply(msg);
    }
  }
};