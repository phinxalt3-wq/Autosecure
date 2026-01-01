const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { queryParams } = require('../../../db/database');

module.exports = async function blacklistedmsg(botnumber, client, userid, db, page = 1) {
    const itemsPerPage = 10;

    // ID = ownerId
    
    const totalCount = await queryParams(
        `SELECT COUNT(*) as count FROM ${db} WHERE client_id = ? AND botnumber = ?`,
        [userid, botnumber]
    );
    const totalItems = totalCount[0].count;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    // Get current page items
    const offset = (page - 1) * itemsPerPage;
    const rows = await queryParams(
        `SELECT * FROM ${db} WHERE client_id = ? AND botnumber = ? LIMIT ? OFFSET ?`,
        [userid, botnumber, itemsPerPage, offset]
    );

    let description = '';
    let title = '';
    let entryIds = [];

    if (db === 'blacklisted') {
        title = 'Blacklisted Users';
        rows.forEach((entry, index) => {
            const itemNumber = offset + index + 1;
            description += `${itemNumber} | <@${entry.user_id}> (ID: ${entry.user_id})\n`;
            entryIds.push(entry.user_id);
        });
    } else if (db === 'blacklistedemails') {
        title = 'Blacklisted Emails';
        rows.forEach((entry, index) => {
            const itemNumber = offset + index + 1;
            description += `${itemNumber} | ${entry.email}\n`;
            entryIds.push(entry.email);
        });
    }

    if (!description) {
        description = 'Nothing found for this page.';
    }

    const embed = new EmbedBuilder()
        .setColor(0xADD8E6)
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: `Page ${page}/${totalPages}` });

    const paginationRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`movesystem|${db}|${page}|fastbackward|${botnumber}|${userid}`)
            .setEmoji('⏪')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page <= 1),
        
        new ButtonBuilder()
            .setCustomId(`movesystem|${db}|${page}|backward|${botnumber}|${userid}`)
            .setEmoji('◀️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page <= 1),

        new ButtonBuilder()
            .setLabel(`${page}/${totalPages}`)
            .setCustomId('page_indicator')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        
        new ButtonBuilder()
            .setCustomId(`movesystem|${db}|${page}|forward|${botnumber}|${userid}`)
            .setEmoji('▶️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= totalPages),
        
        new ButtonBuilder()
            .setCustomId(`movesystem|${db}|${page}|fastforward|${botnumber}|${userid}`)
            .setEmoji('⏩')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= totalPages)
    );

    const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`movesystem|${db}|${page}|add|${botnumber}|${userid}`)
            .setLabel('Add')
            .setStyle(ButtonStyle.Success),
        
        new ButtonBuilder()
            .setCustomId(`movesystem|${db}|${page}|remove|${botnumber}|${userid}`)
            .setLabel('Remove')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(rows.length === 0)
    );

    return { 
        embeds: [embed], 
        components: [paginationRow, actionRow], 
        ephemeral: true 
    };
};
