const isUrl = require('../../utils/utils/isUrl');
const listConfiguration = require('../../utils/settings/listConfiguration');
const listSettings = require('../../utils/settings/listSettings');
const config = require("../../../config.json");

module.exports = {
    name: "changepfp",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            const pfpUrl = interaction.fields.getTextInputValue('pfpurl');
            const splitId = interaction.customId.split('|');
            const isSecureConfig = splitId[1] === "true";
            const table = isSecureConfig ? 'secureconfig' : 'autosecure';

            if (!pfpUrl) {
                await client.queryParams(
                    `UPDATE ${table} SET pfp = ? WHERE user_id = ?`,
                    [config.defaultpfp, client.username]
                );

                let msg = isSecureConfig 
                    ? await listConfiguration(interaction.user.id) 
                    : await listSettings(client, client.username, true);

                msg.content = "Set back to default PFP!";
                return await interaction.update(msg);
            }

            if (!isUrl(pfpUrl)) {
                return await interaction.reply({ 
                    content: 'Not a valid URL!', 
                    ephemeral: true 
                });
            }

            await client.queryParams(
                `UPDATE ${table} SET pfp = ? WHERE user_id = ?`,
                [pfpUrl, client.username]
            );

            let msg = isSecureConfig 
                ? await listConfiguration(interaction.user.id) 
                : await listSettings(client, client.username, true);

            await interaction.update(msg);

        } catch (error) {
            console.error("Error in changepfp command:", error);
            if (!interaction.replied) {
                await interaction.reply({
                    content: "An error occurred while processing your request.",
                    ephemeral: true
                });
            }
        }
    }
};
