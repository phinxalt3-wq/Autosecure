const { queryParams } = require("../../../db/database");

module.exports = {
  name: "submitTitle",
    editmodals: true,
  callback: async (client, interaction) => {
    const [, modalType, botnumber, ownerid] = interaction.customId.split("|");
    const titleInput = interaction.fields.getTextInputValue("titleInput");

    const existingModal = await queryParams(
      "SELECT * FROM modals WHERE user_id = ? AND type = ? AND botnumber = ?",
      [ownerid, modalType, botnumber]
    );

    if (existingModal.length > 0) {
      const modalData = JSON.parse(existingModal[0].modal);
      modalData.title = titleInput;

      await queryParams(
        "UPDATE modals SET modal = ? WHERE user_id = ? AND type = ? AND botnumber = ?",
        [JSON.stringify(modalData), ownerid, modalType, botnumber]
      );
    } else {
      const modalData = { title: titleInput };

      await queryParams(
        "INSERT INTO modals (botnumber, user_id, type, modal) VALUES (?, ?, ?, ?)",
        [botnumber, ownerid, modalType, JSON.stringify(modalData)]
      );
    }

    await interaction.update({
      content: "Title updated for modal `" + modalType + "`"
    });
  },
};