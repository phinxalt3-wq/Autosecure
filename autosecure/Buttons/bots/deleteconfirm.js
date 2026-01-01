const { saveBotConfig, clearBotConfig, sendBotConfigToUser } = require("../../../autosecure/utils/bot/configutils");
const { AttachmentBuilder, EmbedBuilder, ActionRowBuilder } = require("discord.js");
const { autosecureMap } = require("../../../mainbot/handlers/botHandler");

module.exports = {
    name: "deletebotconfirm",
    editbot: true,
    callback: async (client, interaction) => {
        const [_, user_id, botnumber] = interaction.customId.split('|');

        try {
            const botConfig = await saveBotConfig(user_id, botnumber);

            const fileName = `config_bot${botnumber}_${user_id}.json`;
            const configBuffer = Buffer.from(JSON.stringify(botConfig, null, 2));
            const attachment = new AttachmentBuilder(configBuffer, { name: fileName });

            await sendBotConfigToUser(user_id, botnumber, client);

            await clearBotConfig(user_id, botnumber);

            const autosecureKey = `${user_id}|${botnumber}`;
            const botClient = autosecureMap.get(autosecureKey);
            if (botClient) {
                botClient.destroy();
            }
            autosecureMap.delete(autosecureKey);

            // Double delete isnt cool
            const components = interaction.message.components.map(row => {
                const newRow = ActionRowBuilder.from(row);
                newRow.components.forEach(component => component.setDisabled(true));
                return newRow;
            });

            const embed = new EmbedBuilder()
                .setTitle(`Bot #${botnumber} Deleted`)
                .setDescription(`Here's a copy if you need it.`)
                .setColor(0xADD8E6);

            await interaction.update({
                embeds: [embed],
                files: [attachment],
                components: components,
            });

        } catch (error) {
            console.error('Error deleting bot:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: `An error occurred while deleting bot #${botnumber}: ${error.message}`,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: `An error occurred while deleting bot #${botnumber}: ${error.message}`,
                    ephemeral: true
                });
            }
        }
    }
};
