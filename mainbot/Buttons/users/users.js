const usersMsg = require("../../../autosecure/utils/embeds/usersMsg");
const { queryParams } = require("../../../db/database"); 

module.exports = {
    name: "manageusers",
    editclaiming: true,
    callback: async (client, interaction) => {
            let [t, botnumber, ownerid] = interaction.customId.split("|")
            const msg = await usersMsg(ownerid, 1, interaction.user.id, botnumber);
            await interaction.reply(msg); 

    }
};
