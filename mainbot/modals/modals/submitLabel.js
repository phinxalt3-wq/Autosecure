const { queryParams } = require("../../../db/database");

module.exports = {
  name: "submitLabel",
  editmodals: true,
  callback: async (client, interaction) => {
    const [, modalType, botnumber, ownerid] = interaction.customId.split("|");
    const labelInput = interaction.fields.getTextInputValue("labelInput");

    const existingModal = await queryParams(
      "SELECT * FROM modals WHERE user_id = ? AND type = ? AND botnumber = ?",
      [ownerid, modalType, botnumber]
    );

    if (existingModal.length > 0) {
      const modalData = JSON.parse(existingModal[0].modal);
      modalData.setLabel = labelInput;

      await queryParams(
        "UPDATE modals SET modal = ? WHERE user_id = ? AND type = ? AND botnumber = ?",
        [JSON.stringify(modalData), ownerid, modalType, botnumber]
      );
    } else {
      const modalData = { setLabel: labelInput };

      await queryParams(
        "INSERT INTO modals (botnumber, user_id, type, modal) VALUES (?, ?, ?, ?)",
        [botnumber, ownerid, modalType, JSON.stringify(modalData)]
      );
    }

    await interaction.update({
      content: "Label updated for modal `" + modalType + "`"
    });
  },
};