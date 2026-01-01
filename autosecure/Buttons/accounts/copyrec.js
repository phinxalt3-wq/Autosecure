const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { queryParams } = require("../../../db/database");

module.exports = {
    name: "copyrec",
    callback: async (client, interaction) => {
        try {

            let [t, recsecId] = interaction.customId.split("|");
            const results = await client.queryParams("SELECT action FROM actions WHERE id = ?", [recsecId]);


            if (!results || results.length === 0) {
                return interaction.reply({
                    content: `No action found for ID: ${recsecId}`,
                    ephemeral: true,
                });
            }


            let [b, email, secEmail, password, recoveryCode] = results[0].action.split("|");


            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`downloadrec|${recsecId}`) // Corrected `copyTextId` to `recsecId`
                    .setLabel("Download Account")
                    .setStyle(ButtonStyle.Secondary) // Correct enum for button style
            );


            return interaction.reply({
                content: `Email: ${email}\nSecurity Email: ${secEmail}\nPassword: ${password}\nRecovery Code: ${recoveryCode}`,
                components: [row],
                ephemeral: true, // Only visible to the user
            });
        } catch (error) {
            console.error("Error processing copy text:", error);
            return interaction.reply({
                content: "An error occurred while retrieving the action details.",
                ephemeral: true,
            });
        }
    },
};
