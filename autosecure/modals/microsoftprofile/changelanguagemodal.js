const { getLanguageCode, languageData } = require("../../../autosecure/utils/process/helpers");
const listSettings = require("../../../autosecure/utils/settings/listSettings.js");
const listConfiguration = require("../../../autosecure/utils/settings/listConfiguration.js");

module.exports = {
    name: "changelanguagemodal",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            const languageSubmitted = interaction.fields.getTextInputValue('language').trim();
            const splitId = interaction.customId.split('|');
            const isSecureConfig = splitId[1] === "true";
            const table = isSecureConfig ? 'secureconfig' : 'autosecure';

            if (!languageSubmitted) {
                await client.queryParams(
                    `UPDATE ${table} SET language = ? WHERE user_id = ?`,
                    [null, interaction.user.id]
                );

                let msg = isSecureConfig
                    ? await listConfiguration(interaction.user.id)
                    : await listSettings(client, interaction.user.id, true);

                msg.content = "✅ Set back to default language (en-US)!";
                return await interaction.update(msg);
            }

            const checkedLang = await getLanguageCode(languageSubmitted);
            if (!checkedLang) {
                let msg = isSecureConfig
                    ? await listConfiguration(interaction.user.id)
                    : await listSettings(client, interaction.user.id, true);

                msg.content = "❌ Invalid language! Please use a valid language name or code.";
                return await interaction.update(msg);
            }

            await client.queryParams(
                `UPDATE ${table} SET language = ? WHERE user_id = ?`,
                [checkedLang, interaction.user.id]
            );

            let msg = isSecureConfig
                ? await listConfiguration(interaction.user.id)
                : await listSettings(client, interaction.user.id, true);

            msg.content = `✅ Language set to: ${languageData[checkedLang] || checkedLang}`;
            await interaction.update(msg);

        } catch (error) {
            console.error("Error in changelanguage command:", error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: "⚠️ An error occurred while processing your request.",
                    ephemeral: true
                });
            } else if (interaction.deferred) {
                await interaction.editReply({
                    content: "⚠️ An error occurred while processing your request.",
                    ephemeral: true
                });
            }
        }
    }
};
