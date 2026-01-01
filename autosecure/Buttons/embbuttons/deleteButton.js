const { queryParams } = require("../../../db/database");
const editbuttonsmsg = require("../../../autosecure/utils/responses/editbuttonsmsg.js");

module.exports = {
  name: "deletebutton",
    editbuttons: true,
  callback: async (client, interaction) => {
    let type = interaction.customId.split("|")[1];
    let botnumber = Number(interaction.customId.split("|")[2]);
    let ownerid = interaction.customId.split("|")[3];

    await queryParams(
      `DELETE FROM buttons WHERE user_id = ? AND type = ? AND botnumber = ?`,
      [ownerid, type, botnumber]
    );

    let msg = await editbuttonsmsg(type, botnumber, ownerid);
    msg.content = `Deleted your button!`;

    return interaction.update(msg);
  }
};
