const { TextInputStyle } = require("discord.js");
const generate = require("../../utils/generate");
const modalBuilder = require("../../../autosecure/utils/modalBuilder");

module.exports = {
    name: "changepfp",
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
                    [actionId, `changepfp|${parts[1]}|${parts[2]}`]
                );
            } catch (err) {
                // error handling omitted
            }
            customModalId = `action|${actionId}`;
        } else {
            customModalId = isSecure ? `changepfp|true` : `changepfp`;
        }

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
