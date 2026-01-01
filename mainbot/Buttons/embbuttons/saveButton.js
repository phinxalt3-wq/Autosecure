const { queryParams } = require("../../../db/database");

module.exports = {
  name: "savebutton",
  editbuttons: true,
  callback: async (client, interaction) => {
    let type = interaction.customId.split("|")[1];
    let botnumber = interaction.customId.split("|")[2];
    let ownerId = interaction.customId.split("|")[3];
    
    let button;
    if (type === "oauth") {
      button = interaction.message.components[0].components[2].data;
      delete button.custom_id;
      button.type = 2;
      button.style = 5;
    } else {
      button = interaction.message.components[0].components[2].data;
      button.custom_id = type;
    }

  /// id = deprecated and causes issues with multiple bots
    delete button.id;


    let exist = await queryParams(
      `SELECT * FROM buttons WHERE user_id = ? AND type = ? AND botnumber = ?`,
      [ownerId, type, botnumber]
    );

    if (exist.length === 0) {
      await queryParams(
        `INSERT INTO buttons(user_id, type, button, botnumber) VALUES (?, ?, ?, ?)`,
        [ownerId, type, JSON.stringify(button), botnumber]
      );
    } else {
      await queryParams(
        `UPDATE buttons SET button = ? WHERE user_id = ? AND type = ? AND botnumber = ?`,
        [JSON.stringify(button), ownerId, type, botnumber]
      );
    }

    return interaction.update({ content: `Saved your button` });
  },
};
