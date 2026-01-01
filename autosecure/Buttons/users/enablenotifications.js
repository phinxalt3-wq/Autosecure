const editclaimmsg = require("../../../autosecure/utils/responses/editclaimmsg");
const { queryParams } = require("../../../db/database");

module.exports = {
  name: "enablenotifications",
  editclaiming: true,
  description: "Enables notifications (button)",
  callback: async (client, interaction) => {
    await interaction.deferUpdate();
    let [t, botnumber, ownerid] = interaction.customId?.split("|");
    if (!botnumber || !ownerid) {
      return interaction.editReply({ content: "Invalid interaction data.", ephemeral: true });
    }

    try {
      const row = await queryParams(
        `SELECT notifications FROM autosecure WHERE botnumber = ? AND user_id = ?`,
        [botnumber, ownerid],
        "get"
      );
      if (!row) {
        return interaction.editReply({ content: "Settings not found.", ephemeral: true });
      }

      const currentNotifications = row.notifications ?? 0;
      const newNotifications = currentNotifications === 1 ? 0 : 1;

      await queryParams(
        `UPDATE autosecure SET notifications = ? WHERE botnumber = ? AND user_id = ?`,
        [newNotifications, botnumber, ownerid],
        "run"
      );

      const msg = await editclaimmsg(botnumber, ownerid);
      return interaction.editReply(msg);
    } catch (error) {
      return interaction.editReply({ content: `Error updating notifications.`, ephemeral: true });
    }
  },
};
