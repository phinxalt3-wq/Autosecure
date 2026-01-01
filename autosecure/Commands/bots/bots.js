const createbotmsg = require("../../../autosecure/utils/bot/createbotmsg");
const { queryParams } = require("../../../db/database");
const showbotmsg = require("../../utils/bot/showbotmsg");
const userpermissions = require("../../utils/embeds/userpermissions");


module.exports = {
    name: "bots",
    description: "Manage your bots",
    callback: async (client, interaction) => {
          await interaction.deferReply({ ephemeral: true });
        let permissionCheck = { nouser: false, hasperm: true };

        if (interaction.user.id !== client.username) {
            permissionCheck = await checkifuser(client, interaction);

            if (permissionCheck.nouser) {
                return interaction.editReply({
                    content: "Invalid permissions!",
                    ephemeral: true
                });
            }

            if (!permissionCheck.hasperm) {
                return interaction.editReply({
                    content: "You don't have any of the permissions to manage bots.",
                    ephemeral: true
                });
            }
        }

        const msg = await showbotmsg(interaction.user.id, client.botnumber, client.username, client);
        return interaction.editReply(msg);
    }
};

async function checkifuser(client, interaction) {
    const obj = { nouser: false, hasperm: false };

    const users = await queryParams(
        `SELECT * FROM users WHERE user_id = ? AND child = ? AND botnumber = ?`,
        [client.username, interaction.user.id, client.botnumber]
    );

    if (users.length === 0) {
        obj.nouser = true;
        return obj;
    }

    const user = users[0];
    const [userperms] = await userpermissions();

    // dynamically check all valid permissions
    obj.hasperm = Object.values(userperms).some(perm => user[perm.permission] === 1);

    return obj;
}
