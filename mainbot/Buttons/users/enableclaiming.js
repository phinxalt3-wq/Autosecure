const editclaimmsg = require("../../../autosecure/utils/responses/editclaimmsg");
const { queryParams } = require("../../../db/database");

module.exports = {
  name: "enableclaiming",
  editclaiming: true,
  description: "Enables claiming (button)",
  callback: async (client, interaction) => {
    await interaction.deferUpdate();
    let [t, botnumber, ownerid] = interaction.customId?.split("|");
    if (!botnumber || !ownerid) {
      return interaction.editReply({ content: "Invalid interaction data.", ephemeral: true });
    }

    try {
      const rows = await queryParams(
        `SELECT claiming FROM autosecure WHERE botnumber = ? AND user_id = ?`,
        [botnumber, ownerid],
        "get"
      );
      if (!rows) {
        return interaction.editReply({ content: "Settings not found.", ephemeral: true });
      }

      const currentClaiming = rows.claiming ?? 0;
      const newClaiming = currentClaiming === 1 ? 0 : 1;

      await queryParams(
        `UPDATE autosecure SET claiming = ? WHERE botnumber = ? AND user_id = ?`,
        [newClaiming, botnumber, ownerid],
        "run"
      );

      let obj = {}
      obj.claiming = `${newClaiming}`
      let msg = await editclaimmsg(botnumber, ownerid)
      return interaction.editReply(msg)
    } catch (error) {
      return interaction.editReply({ content: `Error updating claiming.`, ephemeral: true });
    }
  },
};
