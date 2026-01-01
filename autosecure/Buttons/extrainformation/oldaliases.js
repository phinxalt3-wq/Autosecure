const { queryParams } = require('../../../db/database');
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "oldaliases",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            let [t, uid] = interaction.customId.split("|");

            const oldaliasesdata = await fetcholdaliases(uid, client);

            const embed = new EmbedBuilder()
                .setTitle("Old Aliases")
                .setColor('#b2c7e0');

            if (!oldaliasesdata || oldaliasesdata.length === 0) {
                embed.setDescription("No old aliases found.");
                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true,
                });
            }

            const lines = oldaliasesdata.map(alias => alias).join('\n');
            embed.setDescription(`\`\`\`\n${lines}\n\`\`\``);

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error("Error fetching or displaying oldaliases data:", error);
            return interaction.reply({
                content: "There was an error processing your request.",
                ephemeral: true,
            });
        }
    }
};

async function fetcholdaliases(uid, client) {
    try {
        const result = await client.queryParams('SELECT oldaliases FROM extrainformation WHERE uid = ?', [uid]);

        if (result && result.length > 0) {
            return JSON.parse(result[0].oldaliases);
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching oldaliases data:", error);
        return null;
    }
}
