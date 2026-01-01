const { queryParams } = require('../../../db/database');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const fs = require('fs');
const path = require('path');

module.exports = {
    name: "subscriptions",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            let [t, uid] = interaction.customId.split("|");

            const subscriptionData = await fetchSubscriptionData(uid, client);
                    //    console.log(subscriptionData)

if (!Array.isArray(subscriptionData) || subscriptionData.length === 0) {
    const embed2 = new EmbedBuilder()
        .setTitle("Subscriptions")
        .setColor(0xb2c7e0);

    return interaction.reply({
        embeds: [embed2],
        ephemeral: true
    });
}



            const embed = new EmbedBuilder()
                .setTitle("Subscriptions")
                .setColor('#b2c7e0');

            subscriptionData.forEach((subscription, index) => {
                const productName = subscription.name;
                const startDate = subscription.startDate;
                const endDate = subscription.endDate;
                const renewalStatus = subscription.autorenews
                const partnerName = subscription.partnerBilling?.partnerName || "N/A";
                const price = subscription?.pastDueBalance?.total || "N/A";
                const daysremaining = subscription?.daysRemaining || "N/A";

                embed.addFields({
                    name: `Subscription #${index + 1}`,
                    value: `Product: ${productName}, Days remaining: ${daysremaining}, Auto-Renews: ${renewalStatus}, Price: ${price}`,
                    inline: false,
                });
            });

/*
const filePath = path.join(__dirname, 'datadata.json');
fs.writeFileSync(filePath, JSON.stringify(subscriptionData, null, 4));
console.log(`Subscription data written to: ${path.resolve(filePath)}`);
*/


            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error("Error fetching or displaying subscription data:", error);
            return interaction.reply({
                content: "An error occured.",
                ephemeral: true,
            });
        }
    }
};


async function fetchSubscriptionData(uid, client) {
    try {
        const result = await client.queryParams('SELECT subscriptions FROM extrainformation WHERE uid = ?', [uid]);
        if (!result?.[0]?.subscriptions) return null;

        let raw = result[0].subscriptions;

        // Double JSON parse for double-encoded strings
        if (typeof raw === "string") {
            try {
                raw = JSON.parse(raw);
                if (typeof raw === "string") {
                    raw = JSON.parse(raw);
                }
            } catch (e) {
                console.error("Error parsing subscriptions JSON:", e);
                return null;
            }
        }

        return Array.isArray(raw) ? raw : null;
    } catch (error) {
        console.error("Error fetching subscription data:", error);
        return null;
    }
}