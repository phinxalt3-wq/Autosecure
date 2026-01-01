const { queryParams } = require("../../../db/database");

module.exports = {
  name: "saveModal",
editmodals: true,
  callback: async (client, interaction) => {
    return interaction.reply({
      content:`Deprecated`,
      ephemeral: true
    })
    const [, modalType] = interaction.customId.split("|");
    console.log(modalType);

    const [result] = await client.queryParams(
      "SELECT * FROM modals WHERE user_id = ? AND type = ?",
      [interaction.user.id, modalType]
    );

    if (!result || !result.modal) {
      return interaction.reply({
        content: "You need to set Title, Label, Placeholder, and Style before saving!",
        ephemeral: true,
      });
    }

await interaction.update({
  content: "Modal saved: `" + modalType + "`"
});
  },
};
