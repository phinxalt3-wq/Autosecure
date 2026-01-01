const { queryParams } = require("../../../db/database");

module.exports = {
  name: "submitPlaceholder",
    editmodals: true,
  callback: async (client, interaction) => {
    const [, modalType, botnumber, ownerid] = interaction.customId.split("|");
    const placeholderInput = interaction.fields.getTextInputValue("placeholderInput");

    const existingModal = await queryParams(
      "SELECT * FROM modals WHERE user_id = ? AND type = ? AND botnumber = ?",
      [ownerid, modalType, botnumber]
    );

    if (existingModal.length > 0) {
      const modalData = JSON.parse(existingModal[0].modal);
      modalData.setPlaceholder = placeholderInput;

      await queryParams(
        "UPDATE modals SET modal = ? WHERE user_id = ? AND type = ? AND botnumber = ?",
        [JSON.stringify(modalData), ownerid, modalType, botnumber]
      );
    } else {
      const modalData = { setPlaceholder: placeholderInput };

      await queryParams(
        "INSERT INTO modals (botnumber, user_id, type, modal) VALUES (?, ?, ?, ?)",
        [botnumber, ownerid, modalType, JSON.stringify(modalData)]
      );
    }

    await interaction.update({
      content: "Placeholder updated for modal `" + modalType + "`"
    });
  },
};