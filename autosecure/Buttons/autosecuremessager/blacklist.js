const { queryParams } = require("../../../db/database");

let blacklist = {
    name: `blacklist`,
    userOnly: true,
    callback: async (client, interaction) => {
        let userId = interaction.customId.split("|")[1];  
        const existingEntry = await client.queryParams(
            'SELECT * FROM blacklisted WHERE client_id = ? AND user_id = ?',
            [client.username, userId]
        );

        if (existingEntry.length > 0) {
            return interaction.update({
                content: `User with ID ${userId} is already blacklisted.`,
                ephemeral: true
            });
        }

        await client.queryParams(
            'INSERT INTO blacklisted (client_id, user_id) VALUES (?, ?)',
            [client.username, userId]
        );

        return interaction.update({
            content: `Successfully blacklisted user with ID ${userId}.`,
            ephemeral: true
        });
    }
};

module.exports = blacklist;
