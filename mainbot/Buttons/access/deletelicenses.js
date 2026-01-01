
const { queryParams } = require("../../../db/database");
const { autosecurelogs } = require("../../../autosecure/utils/embeds/autosecurelogs")

module.exports = {
  name: "deletealllicenses",
  callback: async (client, interaction) => {
    try {
      await queryParams("DELETE FROM licenses");
      autosecurelogs(client, "deletealllicenses", interaction.user.id);
      interaction.reply({ content: "Removed every unused license!", ephemeral: true });
    } catch (err) {
      console.error(err);
      interaction.reply({ content: "An error occurred while deleting licenses.", ephemeral: true });
    }
  }
};
