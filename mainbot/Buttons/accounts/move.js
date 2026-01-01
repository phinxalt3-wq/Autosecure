const accountsmsg = require("../../../autosecure/utils/accounts/accountsmsg");
const { queryParams } = require("../../../db/database");

module.exports = {
    name: "moveacc",
    callback: async (client, interaction) => {
        let [t, id, page, direction] = interaction.customId.split("|");
        let current = parseInt(page);

 

        return interaction.update(await accountsmsg(interaction.user.id, current));
    }
};