const { queryParams } = require("../../../db/database");

module.exports = {
  name: "submitStyle",
    editmodals: true,
  callback: async (client, interaction) => {
    const [, modalType, botnumber, ownerid] = interaction.customId.split("|");
    const styleInput = interaction.fields.getTextInputValue("styleInput").toLowerCase();

    if (styleInput !== "short" && styleInput !== "paragraph") {
      return interaction.reply({
        content: 'Invalid style. Please enter either "short" or "paragraph".',
        ephemeral: true,
      });
    }

    const existingModal = await queryParams(
      "SELECT * FROM modals WHERE user_id = ? AND type = ? AND botnumber = ?",
      [ownerid, modalType, botnumber]
    );

    if (existingModal.length > 0) {
      const modalData = JSON.parse(existingModal[0].modal);
      modalData.setStyle = styleInput;

      await queryParams(
        "UPDATE modals SET modal = ? WHERE user_id = ? AND type = ? AND botnumber = ?",
        [JSON.stringify(modalData), ownerid, modalType, botnumber]
      );
    } else {
      const modalData = { setStyle: styleInput };

      await queryParams(
        "INSERT INTO modals (botnumber, user_id, type, modal) VALUES (?, ?, ?, ?)",
        [botnumber, ownerid, modalType, JSON.stringify(modalData)]
      );
    }

    await interaction.update({
      content: "Style updated for modal `" + modalType + "`"
    });
  },
};