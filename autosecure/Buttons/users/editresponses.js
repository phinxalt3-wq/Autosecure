const { queryParams } = require("../../../db/database");
const usersMsg = require("../../utils/embeds/usersMsg")

module.exports = {
    name: "editresponses",
    editclaiming: true,
    callback: async (client, interaction) => {
        let [t, userId, current] = interaction.customId.split("|");
        let user = await client.queryParams(`SELECT * FROM users WHERE user_id=? AND child=?`, [client.username, userId]);
        
        if (user.length == 0) {
            return interaction.update(await usersMsg(client, current, interaction.user.id));
        }
        
        if (user[0].editresponses) {
            await client.queryParams(`UPDATE users SET editresponses=? WHERE user_id=? AND child=?`, [0, client.username, userId]);
        } else {
            await client.queryParams(`UPDATE users SET editresponses=? WHERE user_id=? AND child=?`, [1, client.username, userId]);
        }
        
        return interaction.update(await usersMsg(client, current, interaction.user.id));
    }
};