const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { queryParams } = require("../../../db/database");

async function getUnclaimedMessage(client, page = 1) {
    try {
        const unclaimedHits = await client.queryParams(
            "SELECT * FROM unclaimed WHERE user_id = ? ORDER BY date DESC",
            [client.username]
        );

        if (!unclaimedHits || unclaimedHits.length === 0) {
            return { content: "There are currently no unclaimed hits!", ephemeral: true };
        }

        const hitsByUid = new Map();
        for (const hit of unclaimedHits) {
            const hitData = JSON.parse(hit.data);
            const { acc, uid } = hitData;
            const username = hit.username;
            const date = hit.date;

            if (!uid || !acc || !acc.oldName) continue;

            if (!hitsByUid.has(uid)) {
                hitsByUid.set(uid, {
                    names: [username],
                    hitData,
                    date
                });
            } else {
                const existing = hitsByUid.get(uid);
                if (!existing.names.includes(username)) {
                    existing.names.push(username);
                }
            }
        }

        if (hitsByUid.size === 0) {
            return { content: "There are currently no unclaimed hits!", ephemeral: true };
        }

        const hitsArray = Array.from(hitsByUid.values());
        const itemsPerPage = 5;
        const totalPages = Math.ceil(hitsArray.length / itemsPerPage);
        page = Math.max(1, Math.min(page, totalPages));

        const startIdx = (page - 1) * itemsPerPage;
        const endIdx = startIdx + itemsPerPage;
        const pageItems = hitsArray.slice(startIdx, endIdx);

        const selectOptions = 
        pageItems.map((item, index) => {
            const displayNames = item.names.map(name => {
                if (name.length <= 2) return name;
                return `${name[0]}${'•'.repeat(name.length - 2)}${name.slice(-1)}`;
            }).join(" | ");

            const cleanValue = displayNames
                .replace(/\s*\|\s*/g, ',')
                .replace(/\s+/g, '');

            const formattedDate = new Date(item.date * 1000).toLocaleString();

            return {
                label: `Hit #${startIdx + index + 1}`,
                description: `${displayNames} | ${formattedDate}`,
                value: `option|${item.hitData.acc.oldName}|${cleanValue}`
            };
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`unclaimed_select|${page}`)
            .setPlaceholder('Select a hit to claim')
            .addOptions(selectOptions);

        const navButtons = [
            new ButtonBuilder()
                .setCustomId(`unclaimed_move|1|first`)
                .setEmoji('⏪')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === 1),
            new ButtonBuilder()
                .setCustomId(`unclaimed_move|${page - 1}|prev`)
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === 1),
            new ButtonBuilder()
                .setCustomId('unclaimed_current')
                .setLabel(`Page ${page}/${totalPages}`)
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`unclaimed_move|${page + 1}|next`)
                .setEmoji('▶️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === totalPages),
            new ButtonBuilder()
                .setCustomId(`unclaimed_move|${totalPages}|last`)
                .setEmoji('⏩')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === totalPages)
        ];

        return {
            content: `**Unclaimed Hits - Page ${page}/${totalPages}**`,
            components: [
                new ActionRowBuilder().addComponents(selectMenu),
                new ActionRowBuilder().addComponents(...navButtons)
            ],
            ephemeral: true
        };
    } catch (error) {
        console.error("Error in getUnclaimedMessage:", error);
        return { content: "An error occurred while fetching unclaimed hits.", ephemeral: true };
    }
}

module.exports = getUnclaimedMessage;
