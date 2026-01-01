const accountsmsg = require("../../../autosecure/utils/accounts/accountsmsg");
const { queryParams } = require("../../../db/database");

module.exports = {
    name: "togglenonmc",
    callback: async (client, interaction) => {
        const [t, userId] = interaction.customId.split("|");
        

        const settingsQuery = await client.queryParams(
            `SELECT hidenonmc FROM settings WHERE user_id=?`, 
            [userId]
        );
        

        const currentSetting = settingsQuery[0]?.hidenonmc === 1;
        

        const newSetting = !currentSetting;
        

        await client.queryParams(
            `UPDATE settings SET hidenonmc=? WHERE user_id=?`,
            [newSetting ? 1 : 0, userId]
        );
        

        return interaction.update(await accountsmsg(interaction.user.id, 1));
    }
};