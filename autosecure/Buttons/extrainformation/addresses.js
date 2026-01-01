const { EmbedBuilder } = require("discord.js");
const countries = require("i18n-iso-countries");
const { queryParams } = require("../../../db/database")

countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

module.exports = {
    name: "addresses",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            const [_, uid] = interaction.customId.split("|");

            const addresses = await fetchAddresses(uid, client);

            if (!addresses || addresses.length === 0) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("Addresses")
                            .setDescription("No addresses found.")
                            .setColor('#b2c7e0')
                    ],
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle("Addresses")
                .setColor('#b2c7e0');

            const descriptions = addresses.map((ad, i) => {
                const parts = [];

                if (ad.line1) parts.push(ad.line1);
                if (ad.city) parts.push(ad.city);
                if (ad.state) parts.push(ad.state);

                const zip = ad.zip ? `(${ad.zip})` : '';
                const country = countries.getName(ad.countryId, "en") || `Unknown (${ad.countryId})`;

                return `${i + 1} | ${parts.join(', ')} ${zip} [${country}]`;
            });

            embed.setDescription(descriptions.join('\n'));

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error("Error in addresses command:", error);
            await interaction.reply({
                content: "An error occurred while processing your request.",
                ephemeral: true
            });
        }
    }
};


async function fetchAddresses(uid) {
    try {
        const result = await queryParams(
            'SELECT addresses FROM extrainformation WHERE uid = ?',
            [uid]
        );

        if (!result?.[0]?.addresses) return [];

        let raw = result[0].addresses;

        if (typeof raw === "string") {
            try {
                raw = JSON.parse(raw);
                if (typeof raw === "string") {
                    raw = JSON.parse(raw);
                }
            } catch (e) {
                console.error("Error parsing addresses JSON:", e);
                return [];
            }
        }

        return Array.isArray(raw) ? raw : [];
    } catch (error) {
        console.error("Error fetching address data:", error);
        return [];
    }
}

