const { queryParams } = require('../../../db/database');
const generate = require('../../utils/generate');

module.exports = {
    name: "showpfpautosecure",
    editautosecure: true,
    callback: async (client, interaction) => {
        let [t, botnumber, ownerid] = interaction.customId.split("|");

        let settings;
        try {
            settings = await queryParams(
                `SELECT * FROM autosecure WHERE user_id=? AND botnumber=?`,
                [ownerid, botnumber]
            );
        } catch (err) {
            return interaction.reply({ content: "Error fetching settings.", ephemeral: true });
        }

        if (!settings || settings.length === 0) {
            return interaction.reply({ content: `Couldn't get your settings!`, ephemeral: true });
        }

        const pfp = settings[0]?.pfp || "No PFP Set, make a ticket about this :)";

        return interaction.reply({ content: pfp, ephemeral: true });
    }
};
