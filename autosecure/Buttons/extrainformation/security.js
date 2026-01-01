const { queryParams } = require('../../../db/database');
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "security",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            let [t, uid] = interaction.customId.split("|");

            const securitydata = await fetchsecurity(uid, client);

            const embed = new EmbedBuilder()
                .setTitle("Original Security Info")
                .setColor('#b2c7e0');

            if (!securitydata) {
                return interaction.reply({
                    embeds: [embed.setDescription("No security information available.")],
                    ephemeral: true,
                });
            }

            let description = '';

            if (securitydata.emails) {
                try {
                    const emails = JSON.parse(securitydata.emails);
                    if (emails.length > 0) {
                        description += `Email(s)\n\`\`\`\n`;
                        for (const email of emails) {
                            description += `${email.displayProofName}\n`;
                        }
                        description += `\`\`\`\n`;
                    }
                } catch (e) {}
            }

            if (securitydata.phoneNumbers) {
                try {
                    const phones = JSON.parse(securitydata.phoneNumbers);
                    if (phones.length > 0) {
                        description += `Phone Number(s)\n\`\`\`\n`;
                        for (const phone of phones) {
                            const full = phone.displayProofId;
                            const partial = phone.displayProofName;
                            const diff = full.slice(0, full.length - partial.length);
                            description += `+${diff} ${partial}\n`;
                        }
                        description += `\`\`\`\n`;
                    }
                } catch (e) {}
            }

            if (securitydata.authApp) {
                let mark = '❌';
                try {
                    const parsed = JSON.parse(securitydata.authApp);
                    if ((Array.isArray(parsed) && parsed.length > 0) || (!Array.isArray(parsed) && Object.keys(parsed).length > 0)) {
                        mark = '✅';
                    }
                } catch (e) {}
                description += `Auth App\n\`\`\`\n${mark}\n\`\`\``;
            }

            if (description === '') {
                description = "No valid security information found.";
            }

            embed.setDescription(description.trim());

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error("Error fetching or displaying security data:", error);
            return interaction.reply({
                content: "There was an error processing your request.",
                ephemeral: true,
            });
        }
    }
};

async function fetchsecurity(uid, client) {
    try {
        const result = await client.queryParams('SELECT security FROM extrainformation WHERE uid = ?', [uid]);

        if (result && result.length > 0) {
            return JSON.parse(result[0].security);
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching security data:", error);
        return null;
    }
}
