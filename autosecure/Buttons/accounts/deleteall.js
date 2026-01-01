const { queryParams } = require("../../../db/database");
const accountsmsg = require('../../utils/accounts/accountsmsg');

module.exports = {
    name: "deleteaccounts",
    callback: async (client, interaction) => {
        let [t, id, current] = interaction.customId.split("|");
        current = parseInt(current);


        await client.queryParams(`DELETE FROM accountsbyuser WHERE user_id=?`, [id]);


        current = 1;


        return interaction.update(await accountsmsg(id, current));
    }
};