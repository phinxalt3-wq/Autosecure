const { queryParams } = require('../../../db/database');
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "newaliases",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            let [t, uid] = interaction.customId.split("|");

            const newaliasesdata = await fetchnewaliases(uid, client);

            const embed = new EmbedBuilder()
                .setTitle("New Aliases")
                .setColor('#b2c7e0');

            if (!newaliasesdata || newaliasesdata.length === 0) {
                embed.setDescription("No new aliases found.");
                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true,
                });
            }

            const lines = newaliasesdata.map(alias => alias).join('\n');
            embed.setDescription(`\`\`\`\n${lines}\n\`\`\``);
            

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error("Error fetching or displaying newaliases data:", error);
            return interaction.reply({
                content: "There was an error processing your request.",
                ephemeral: true,
            });
        }
    }
};

async function fetchnewaliases(uid, client) {
    try {
        const result = await client.queryParams('SELECT newaliases FROM extrainformation WHERE uid = ?', [uid]);

        if (result && result.length > 0) {
            return JSON.parse(result[0].newaliases);
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching newaliases data:", error);
        return null;
    }
}
