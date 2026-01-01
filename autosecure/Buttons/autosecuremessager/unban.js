const { queryParams } = require("../../../db/database");

let unban = {
    name: `unban`,
    userOnly: true,
    callback: async (client, interaction) => {
        let id = interaction.customId.split("|").slice(1).join("|");
        try {
            let server = await client.queryParams(`SELECT * FROM autosecure WHERE user_id=?`, [client.username]);
            if (server.length == 0) {
                return interaction.update({ content: `Failed to unban <@${id}>` });
            }
            server = server[0].server_id;
            if (server) {
                await client.guilds.cache.get(server).members.unban(id);
                return interaction.update({ content: `Unbanned <@${id}>` });
            }
        } catch (e) {
            if (e.code === 10026) {
                return interaction.update({ content: `This user is not banned!` });
            }

            return interaction.update({ content: `Failed to unban <@${id}>` });
        }
    }
};

module.exports = unban;
