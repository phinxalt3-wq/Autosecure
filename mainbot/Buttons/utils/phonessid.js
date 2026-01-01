const { queryParams } = require("../../../db/database");

module.exports = {
    name: "phonessid",
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply({ ephemeral: true });

            const [t, ssidid] = interaction.customId.split("|");
        //    console.log(`SSID ID: ${ssidid}`);

            if (ssidid.length >= 40) {
                return interaction.editReply({
                    content: ssidid,
                    ephemeral: true,
                });
            }

            let actionData = await queryParams(`SELECT * FROM actions WHERE id=?`, [ssidid]);

            if (actionData.length === 0) {
                return interaction.editReply({
                    content: "Couldn't find your SSID!",
                    ephemeral: true,
                });
            }

            const ssid = actionData[0].action.split('|')[1];

            return interaction.editReply({
                content: ssid,
                ephemeral: true,
            });

        } catch (error) {
            console.error("Error in phonessid command:", error);

            if (interaction.deferred || interaction.replied) {
                return interaction.editReply({
                    content: "An error occurred while processing your request.",
                    ephemeral: true,
                });
            }

            return interaction.reply({
                content: "An error occurred while processing your request.",
                ephemeral: true,
            });
        }
    },
};
