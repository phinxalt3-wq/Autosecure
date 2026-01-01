const { queryParams } = require("../../../db/database");

let ban = {
    name: `ban`,
    userOnly: true,
    callback: async (client, interaction) => {
        let id = interaction.customId.split("|").slice(1).join("|")
        try {
            let server = await client.queryParams(`SELECT * FROM autosecure WHERE user_id=?`, [client.username])
            if (server.length == 0) {
                return interaction.update({ content: `Failed to ban <@${id}>` })
            }
            server = server[0].server_id
            if (server) {
                await client.guilds.cache.get(server).members.cache.get(id).ban()
                return interaction.update({ content: `Banned <@${id}>` })
            }
        } catch (e) {
            if (e.code === 50013) {
                return interaction.update({ content: `This bot is missing permissions. Give the bot administrator permissions in your server!` });
            }

            return interaction.update({ content: `Failed to ban <@${id}>` })
        }
    }
};
module.exports = ban;
