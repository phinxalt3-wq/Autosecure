const { TextInputStyle } = require("discord.js");
const generate = require("../../utils/generate");
const modalBuilder = require("../../../autosecure/utils/modalBuilder");
const { queryParams } = require("../../../db/database");

module.exports = {
    name: "changedomainautosecure",
    editautosecure: true,
    callback: async (client, interaction) => {
        let [t, botnumber, ownerid] = interaction.customId.split("|");
        let actionId = generate(32);
        await queryParams(
            `INSERT INTO actions (id, action) VALUES (?, ?)`,
            [actionId, `changedomainmodal|${botnumber}|${ownerid}`]
        );
        let customModalId = `action|${actionId}`




        interaction.showModal(modalBuilder(
            customModalId,
            `Change Secure domain`,
            [
                {
                    setCustomId: 'emaildomain',
                    setRequired: false,
                    setLabel: 'Enter new domain',
                    setPlaceholder: 'e.g. airs.fyi',
                    setStyle: TextInputStyle.Short
                }
            ]
        ));
    }
};
