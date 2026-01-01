const { queryParams } = require('../../../db/database');
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "purchases",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            let [_, uid] = interaction.customId.split("|");

            const purchaseData = await fetchPurchaseData(uid);

            const embed = new EmbedBuilder()
                .setTitle("Purchases")
                .setColor('#b2c7e0');

            if (!purchaseData || !Array.isArray(purchaseData.orders) || purchaseData.orders.length === 0) {
                return interaction.reply({
                    embeds: [embed],
                    ephemeral: true,
                });
            }

            const description = purchaseData.orders.map((order, index) => {
                const item = order.orderLineItems?.[0];
                if (!item) return null;

                const orderId = order.orderId;
                const itemId = item.orderLineItemId;
                const type = item.productType;
                const itemDescription = item.description;
                const price = item.totalAmount;

                return `**${index + 1}. Order ID:** \`${orderId}\`\n` +
                       `**Item ID:** \`${itemId}\`\n` +
                       `**Type:** \`${type}\`\n` +
                       `**Description:** \`${itemDescription}\`\n` +
                       `**Price:** \`$${price.toFixed(2)}\`\n`;
            }).filter(Boolean).join('\n');

            embed.setDescription(description);

            await interaction.reply({ 
                embeds: [embed], 
                ephemeral: true 
            });
        } catch (error) {
            console.error("Error in purchases command:", error);
            return interaction.reply({
                content: "There was an error processing your request.",
                ephemeral: true,
            });
        }
    }
};

async function fetchPurchaseData(uid) {
    try {
        const result = await queryParams('SELECT purchases FROM extrainformation WHERE uid = ?', [uid]);
        if (!result?.[0]?.purchases) return null;

        let raw = result[0].purchases;

        // Double JSON parse for double-encoded strings
        if (typeof raw === "string") {
            try {
                raw = JSON.parse(raw);
                if (typeof raw === "string") {
                    raw = JSON.parse(raw);
                }
            } catch (e) {
                console.error("Error parsing purchases JSON:", e);
                return null;
            }
        }

        return raw;
    } catch (error) {
        console.error("Error fetching purchase data:", error);
        return null;
    }
}