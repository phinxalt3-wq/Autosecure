const { queryParams } = require("../../../db/database");
const listSettings = require("../../utils/settings/listSettings");

module.exports = {
    name: "oauthlink",
    callback: async (client, interaction) => {
        try {
            let oauth = interaction.components[0].components[0].value;

            if (oauth && !/^https?:\/\//i.test(oauth)) {
                oauth = "https://" + oauth;
            }

            if (oauth && !isValidUrl(oauth)) {
                return interaction.update({
                    content: `Invalid URL!`,
                    ephemeral: true
                });
            }

            if (oauth.length === 0) {
                await client.queryParams(`UPDATE autosecure SET oauth_link=NULL WHERE user_id=?`, [interaction.user.id]);
                const settingsResponse = await listSettings(client, client.username);
                settingsResponse.content = `Removed your oAuth!`;
                return interaction.update(settingsResponse);
            }

            await Promise.all([
                client.queryParams(`UPDATE autosecure SET oauth_link=? WHERE user_id=?`, [oauth, interaction.user.id]),
                listSettings(client, client.username)
            ])
            .then(([_, settingsResponse]) => {
                settingsResponse.content = `Set your OAuth to: ${oauth}`;
                return interaction.update(settingsResponse);
            })
            .catch(err => {
                return interaction.update({
                    content: `There was an error updating the OAuth link.`,
                    ephemeral: true
                });
            });

        } catch (error) {
            return interaction.update({
                content: `An unexpected error occurred.`,
                ephemeral: true
            });
        }
    }
};

const isValidUrl = (urlString) => {
    try {
        new URL(urlString);
        return true;
    } catch (err) {
        return false;
    }
};