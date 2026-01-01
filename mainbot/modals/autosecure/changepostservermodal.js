
const editautosecuremsg = require("../../../autosecure/utils/embeds/editautosecuremsg");
const { queryParams } = require("../../../db/database");

module.exports = {
    name: "changepostservermodal",
    editautosecure: true,
    callback: async (client, interaction) => {
        try {
            const [t, botnumber, ownerid] = interaction.customId.split("|");

            let postserver = interaction.components[0].components[0].value.trim();

            if (postserver.length === 0) {
                await queryParams(
                    `UPDATE autosecure SET postserver = NULL WHERE user_id = ? AND botnumber = ?`,
                    [ownerid, botnumber]
                );
                const settingsResponse = await editautosecuremsg(botnumber, ownerid);
                settingsResponse.content = `✅ Removed your Post Server!`;
                return interaction.update(settingsResponse);
            }

            if (!isValidUrl(postserver)) {
                return interaction.update({
                    content: `❌ Invalid URL! Please enter a valid Post Server URL.`,
                    ephemeral: true
                });
            }

            await queryParams(
                `UPDATE autosecure SET postserver = ? WHERE user_id = ? AND botnumber = ?`,
                [postserver, ownerid, botnumber]
            );

            const settingsResponse = await editautosecuremsg(botnumber, ownerid);
            settingsResponse.content = `✅ Set your Post Server to: ${postserver}`;
            return interaction.update(settingsResponse);

        } catch (error) {
            console.error("Error in changepostservermodal:", error);
            return interaction.update({
                content: `❌ An unexpected error occurred.`,
                ephemeral: true
            });
        }
    }
};

const isValidUrl = (urlString) => {
    try {
        new URL(urlString);
        return true;
    } catch {
        return false;
    }
};
