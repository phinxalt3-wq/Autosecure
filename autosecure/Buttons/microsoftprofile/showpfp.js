const generate = require('../../utils/generate');

module.exports = {
    name: "showpfp",
    callback: async (client, interaction) => {

        const parts = interaction.customId.split('|');
        const username = parts[1];
        const config = parts[2] ? true : false;

        let settings;
        try {
            if (config) {
                settings = await client.queryParams(`SELECT * FROM secureconfig WHERE user_id = ?`, [username]);
            } else {
                settings = await client.queryParams(`SELECT * FROM autosecure WHERE user_id = ?`, [username]);
            }
        } catch (err) {
            // console.error(`[showpfp] DB query error:`, err);
            return interaction.reply({ content: "Error fetching settings.", ephemeral: true });
        }

        if (!settings || settings.length === 0) {
            // // console.log(`[showpfp] No settings found for user: ${username}`);
            return interaction.reply({ content: `Couldn't get your settings!`, ephemeral: true });
        }

        const pfp = settings[0]?.pfp || "No PFP Set, make a ticket about this :)";
        // // console.log(`[showpfp] Returning pfp for user: ${username}`);

        return interaction.reply({ content: pfp, ephemeral: true });
    }
};
