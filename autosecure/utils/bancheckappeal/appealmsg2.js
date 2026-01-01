const { EmbedBuilder } = require('discord.js');
const { bancheck } = require('./bancheck');
const { appealmsg } = require('./appealmsg');
const config = require('../../../config.json');

async function appealmsg2(userid, ssid) {
    try {
        // 1. Check ban status
        const banData = await bancheck(ssid);

        if (banData.banReason === "invalid_token") {
            return {
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Invalid SSID")
                        .setDescription("This SSID seems to be invalid or expired!")
                        .setColor("Red")
                ],
                ephemeral: true
            };
        }

        if (!banData.username) {
            return {
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Profile Error")
                        .setDescription("Could not retrieve Minecraft profile data for this SSID.")
                        .setColor("Red")
                ],
                ephemeral: true
            };
        }

        if (banData.ban === "Couldn't check ban:") {
            return {
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Couldn't check ban for appeal")
                        .setDescription(`Reason: \`${banData.banReason}\``)
                        .setColor("Orange")
                ],
                ephemeral: true
            };
        }

        if (!banData.ban) {
            return {
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Account Not Banned")
                        .setDescription(`Your account **${banData.username}** is not currently banned on Hypixel, no need to appeal it :)`)
                        .setColor("Green")
                ],
                ephemeral: true
            };
        }

        if (banData.banReason !== "security") {
            return {
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Invalid Ban Type")
                        .setDescription(`This command can only autoappeal **security** bans. Your account **${banData.username}** is banned for: \`${banData.banReason || 'unknown'}\``)
                        .addFields(
                            { name: "Ban ID", value: banData.banId || 'N/A', inline: true },
                            { name: "Unban Time", value: banData.banTimeFormatted || 'N/A', inline: true }
                        )
                        .setColor("Red")
                ],
                ephemeral: true
            };
        }

        // 2. If security banned, process appeal
        try {
            const msg = await appealmsg(userid, ssid);
            return msg;
        } catch (err) {
            return {
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Failed to send appeal, report this as id: appeal2A")
                        .setColor("Red")
                ],
                ephemeral: true
            };
        }

    } catch (err) {
        return {
            embeds: [
                new EmbedBuilder()
                    .setTitle("Unknown error")
                    .setColor("Red")
            ],
            ephemeral: true
        };
    }
}

module.exports = appealmsg2;