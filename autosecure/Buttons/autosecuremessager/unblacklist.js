const { queryParams } = require("../../../db/database");

let unblacklist = {
    name: `unblacklist`,
    userOnly: true,
    callback: async (client, interaction) => {
        let userId = interaction.customId.split("|")[1];  
        const existingEntry = await client.queryParams(
            'SELECT * FROM blacklisted WHERE client_id = ? AND user_id = ?',
            [client.username, userId]
        );

        if (existingEntry.length == 0) {
            return interaction.update({
                content: `User with ID ${userId} was not blacklisted.`,
                ephemeral: true
            });
        }

        await client.queryParams(
            'DELETE FROM blacklisted WHERE client_id = ? AND user_id = ?',
            [client.username, userId]
        );

        return interaction.update({
            content: `Successfully unblacklisted user with ID ${userId}.`,
            ephemeral: true
        });
    }
};

module.exports = unblacklist;
