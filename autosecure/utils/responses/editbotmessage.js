const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { queryParams } = require('../../../db/database');
const { codeblock } = require('../../../autosecure/utils/process/helpers');
const { autosecureMap } = require('../../../mainbot/handlers/botHandler');
const generate = require('../utils/generate');

async function editbotmsg(client, interaction, botnumber, ownerid) {

    let hidebutton = false
    if (client.isuserbot) hidebutton = true
   
    let c = await autosecureMap.get(`${ownerid}|${botnumber}`);

    try {
        const botData = await queryParams(
            "SELECT activity FROM autosecure WHERE user_id = ? AND botnumber = ? LIMIT 1",
            [ownerid, botnumber],
            "get"
        );

        let activityData = {};
        if (botData && botData.activity) {
            try {
                activityData = JSON.parse(botData.activity);
            } catch {
                const embed = new EmbedBuilder()
                    .setDescription("Invalid activity data format.")
                    .setColor(0xFF0000);

                return {
                    embeds: [embed],
                    components: [],
                    ephemeral: true
                };
            }
        }

        const typeText = activityData.type || 'None';
        const messageText = activityData.text || '';
        const visibility = activityData.visibility || 'online';

        // Only show messageText if typeText is not 'None'
        const statusText = typeText === 'None' ? 'None' : `${typeText} ${messageText}`.trim();
        const activityBlock = codeblock(statusText);
        const visibilityBlock = codeblock(visibility);


const readyTimestampMs = c?.readyTimestamp || 0;
let sessionText;

if (!readyTimestampMs) {
    sessionText = "**Session: not started yet**";
} else {
    const readyTimestampSec = Math.floor(readyTimestampMs / 1000);
    sessionText = `**Session started** \n <t:${readyTimestampSec}:R>`;
}

const embed = new EmbedBuilder()
    .setTitle("Your Bots Config")
    .setColor(6016246)
    .addFields(
        { name: "Status", value: `\`\`\`${statusText}\`\`\``, inline: true },
        { name: "Visibility", value: `\`\`\`${visibility}\`\`\``, inline: true }
    );


        const result = await queryParams(
            'SELECT * FROM autosecure WHERE user_id = ? AND botnumber = ?',
            [ownerid, botnumber]
        );

        let generatedid = generate(32);
        const save = `restart|${ownerid}|${botnumber}|${result[0].token}|${c ? 'offline' : 'online'}`;
        await queryParams(`INSERT INTO actions (id, action) VALUES (?, ?)`, [generatedid, save]);

        const key = `${ownerid}|${botnumber}`;

const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setLabel('Bot Status')
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`botstatus|${ownerid}|${botnumber}`),
    new ButtonBuilder()
        .setLabel('Reload Commands')
        .setStyle(ButtonStyle.Danger)
        .setCustomId(`reloadcommands|${ownerid}|${botnumber}`),
    new ButtonBuilder()
        .setLabel('Delete')
        .setStyle(ButtonStyle.Danger)
        .setCustomId(`deletebot|${ownerid}|${botnumber}`),
    new ButtonBuilder()
        .setLabel('Download Config')
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`downloadconfig|${ownerid}|${botnumber}`)
);

const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
        .setLabel('Restart')
        .setStyle(ButtonStyle.Success)
        .setCustomId(`action|${generatedid}`),
    new ButtonBuilder()
        .setLabel('Swap Token')
        .setStyle(ButtonStyle.Success)
        .setCustomId(`swaptoken|${ownerid}|${botnumber}`)
);

const components = [row1, row2];

return {
    embeds: [embed],
    components: components,
    ephemeral: true
};

    } catch (error) {
        console.error("Error in editbotmsg function:", error);

        const embed = new EmbedBuilder()
            .setDescription("An error occurred while processing your request.")
            .setColor(0xFF0000);

        return {
            embeds: [embed],
            components: [],
            ephemeral: true
        };
    }
}

module.exports = { editbotmsg };