const { queryParams } = require("../../../db/database");
const usersMsg = require("../../../autosecure/utils/embeds/usersMsg")
const { addnotification } = require("../../../mainbot/utils/usernotifications");

module.exports = {
    name: "bettersplit",
    editclaiming: true,
    callback: async (client, interaction) => {
        try {
            let [t, child, current, split, claiming, ownerid, botnumber] = interaction.customId.split("|");
            let newsplit = Number(split) - 1;

            if (newsplit > 0.1) {
                await queryParams(
                    `UPDATE users SET split=? WHERE user_id=? AND child=? AND botnumber=?`,
                    [newsplit, ownerid, child, botnumber]
                );
            }

            await addnotification(client, child);

            return interaction.update(await usersMsg(ownerid, current, interaction.user.id, botnumber));
        } catch (error) {
            console.error("Error in bettersplit command:", error);
        }
    },
};
