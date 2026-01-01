const { queryParams } = require('../../../db/database')
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "family",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            let [t, uid] = interaction.customId.split("|");

            const familyData = await fetchFamilyData(uid, client);

            const embed = new EmbedBuilder()
                .setTitle("Family")
                .setColor('#b2c7e0')
                .setDescription(familyData || "No family data found.");

            return interaction.reply({
                embeds: [embed],
                ephemeral: true,
            });

        } catch (error) {
            console.error("Error fetching or displaying family data:", error);
            return interaction.reply({
                content: "There was an error processing your request.",
                ephemeral: true,
            });
        }
    }
};

async function fetchFamilyData(uid, client) {
    try {
        const result = await queryParams('SELECT family FROM extrainformation WHERE uid = ?', [uid]);

        if (result && result.length > 0) {
            return result[0].family; 
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching family data:", error);
        return null;
    }
}
