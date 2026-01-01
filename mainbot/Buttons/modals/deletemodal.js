const { queryParams } = require("../../../db/database.js");

module.exports = {
  name: "deletemodal",
  callback: async (client, interaction) => {
    const [, modalType, botnumber, ownerid] = interaction.customId.split("|");

    await queryParams(
      "DELETE FROM modals WHERE user_id = ? AND type = ? AND botnumber = ?",
      [ownerid, modalType, botnumber]
    );

    await interaction.update({
      content: "Modal deleted: `" + modalType + "`"
    });
  },
};
