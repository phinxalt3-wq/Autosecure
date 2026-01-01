const { queryParams } = require('../../../db/database');
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "oauths",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            let [t, uid] = interaction.customId.split("|");

            const oauthDataString = await fetchoAuthData(uid, client);
            const oauthData = JSON.parse(oauthDataString);

            if (!oauthData || !oauthData.oauths || oauthData.oauths.length === 0) {
                const embed = new EmbedBuilder()
                .setTitle("OAuth Apps (after remove if applicable)")
                    .setColor('#b2c7e0');

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            const lines = oauthData.oauths.map((oauth, index) => {
                return `${index} | ${oauth.appName} (${oauth.clientId})`;
            });

            const embed = new EmbedBuilder()
                .setTitle("OAuth Apps (after remove if applicable)")
                .setDescription(lines.join("\n"))
                .setColor('#b2c7e0');

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        } catch (error) {
            console.error("Error fetching or displaying OAuth data:", error);
            return interaction.reply({
                content: "There was an error processing your request.",
                ephemeral: true
            });
        }
    }
};

async function fetchoAuthData(uid, client) {
    try {
        const result = await client.queryParams('SELECT oauthsafter FROM extrainformation WHERE uid = ?', [uid]);

        if (result && result.length > 0 && result[0].oauthsafter) {
            return result[0].oauthsafter;
        } else {
            return JSON.stringify({ oauthquantity: 0, oauths: [] });
        }
    } catch (error) {
        console.error("Error fetching OAuth data:", error);
        return JSON.stringify({ oauthquantity: 0, oauths: [] });
    }
}
