const { queryParams } = require("../../../db/database");
const usersMsg = require("../../../autosecure/utils/embeds/usersMsg")

module.exports = {
    name: "removeuser",
    editclaiming: true,
    callback: async (client, interaction) => {
        const [, page, userId, ownerid, botnumber] = interaction.customId.split("|");
        

        await client.queryParams(
            `DELETE FROM users WHERE user_id=? AND child=? AND botnumber=?`, 
            [ownerid, userId, botnumber]
        );
        

        return interaction.update(
            await usersMsg(ownerid, parseInt(page), interaction.user.id, botnumber)
        );
    }
};