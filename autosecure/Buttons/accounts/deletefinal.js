const { queryParams } = require("../../../db/database");
const accountsmsg = require('../../utils/accounts/accountsmsg');

module.exports = {
    name: "deletefinal",
    callback: async (client, interaction) => {
        let [t, id, current, uid] = interaction.customId.split("|"); // Extract UID from customId
        current = parseInt(current);


        await client.queryParams(`DELETE FROM accountsbyuser WHERE user_id=? AND uid=?`, [id, uid]);


        const remainingAccounts = await client.queryParams(`SELECT * FROM accountsbyuser WHERE user_id=?`, [id]);


        if (remainingAccounts.length === 0) {
            current = 1;
        } else if (current > remainingAccounts.length) {

            current = remainingAccounts.length;
        }


        return interaction.update(await accountsmsg(id, current));
    }
};