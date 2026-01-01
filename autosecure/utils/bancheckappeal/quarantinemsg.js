const { EmbedBuilder } = require('discord.js');
const { bancheck } = require('./bancheck');
const { queryParams } = require('../../../db/database');
const { addquarantine } = require('../../../mainbot/handlers/quarantineutils');

function decodeJwtPayload(token) {
    try {
        const payloadBase64 = token.split('.')[1];
        const payload = Buffer.from(payloadBase64, 'base64').toString('utf-8');
        return JSON.parse(payload);
    } catch {
        return null;
    }
}

function safeToString(value) {
    if (value === null || value === undefined) return '';
    return String(value);
}

async function quarantinemsg(userId, ssid) {
    const proxyCheck = await queryParams(
        `SELECT proxy FROM proxies WHERE user_id = ?`,
        [userId]
    );

    if (!proxyCheck || proxyCheck.length === 0) {
        return {
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('No Proxies Configured')
                    .setDescription('Please set up at least one proxy in `/quarantine` first!')
            ]
        };
    }

    if (!ssid || ssid.length < 8) {
        return {
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('Invalid SSID')
                    .setDescription('Please provide a valid SSID token')
            ]
        };
    }

    const payload = decodeJwtPayload(ssid);
    if (!payload?.exp) {
        return {
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('Invalid SSID Format')
                    .setDescription('The provided SSID is malformed or invalid')
            ]
        };
    }

    if (Date.now() > payload.exp * 1000) {
        return {
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('Expired SSID')
                    .setDescription('This SSID has already expired')
            ]
        };
    }

    const banCheck = await bancheck(ssid).catch(err => {
        console.error('Ban check failed:', err);
        return { ban: false, error: err.message };
    });

    if (banCheck.banReason === 'invalid_token' || banCheck.error) {
        return {
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('Invalid SSID')
                    .setDescription('The provided SSID is invalid or expired')
            ]
        };
    }

    if (
        typeof banCheck.ban === 'string' &&
        banCheck.ban.includes("Couldn't check ban:") &&
        typeof banCheck.banReason === 'string' &&
        !banCheck.banReason.includes('online')
    ) {
        return {
            embeds: [
                new EmbedBuilder()
                    .setColor(0xFFA500)
                    .setDescription(`${banCheck.ban} \`${banCheck.banReason}\``)
            ]
        };
    }

    if (
        typeof banCheck.ban === 'string' &&
        banCheck.ban &&
        typeof banCheck.banReason === 'string' &&
        !banCheck.banReason.includes('online')
    ) {
        return {
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setDescription('This account cannot join Hypixel')
                    .addFields([
                        { name: 'Username', value: safeToString(banCheck.username), inline: true },
                        { name: 'Ban Reason', value: safeToString(banCheck.banReason), inline: true }
                    ])
            ]
        };
    }

    if (!banCheck.username || !banCheck.uuid) {
        return {
            embeds: [
                new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('Account Not Found')
                    .setDescription(`Couldn't get minecraft data.`)
            ]
        };
    }

    const [existing] = await queryParams(
        'SELECT id FROM quarantine WHERE uuid = ? OR name = ?',
        [banCheck.uuid, banCheck.username]
    );

    if (existing) {
        const isOwnAccount = await queryParams(
            'SELECT 1 FROM quarantine WHERE id = ? AND user_id = ?',
            [existing.id, userId]
        ).then(res => res.length > 0);

        return {
            embeds: [
                new EmbedBuilder()
                    .setColor(0xffaa00)
                    .setTitle('Already Quarantined')
                    .setDescription(
                        isOwnAccount
                            ? `You already have ${banCheck.username} in quarantine`
                            : `${banCheck.username} is already quarantined by another user`
                    )
            ]
        };
    }

    const profile = {
        name: banCheck.username,
        uuid: banCheck.uuid
    };

    await addquarantine(userId, ssid, profile);

    const expirationTime = new Date(payload.exp * 1000);
    const remainingHours = Math.floor((expirationTime - Date.now()) / 3600000);
    const showDetailedTime = remainingHours > 12;

    return {
        embeds: [
            new EmbedBuilder()
                .setColor(0xADD8E6)
                .setTitle('Quarantine Started')
                .setDescription("Use /removequarantine to stop early")
                .addFields([
                    { name: 'Username', value: `\`\`\`\n${banCheck.username}\n\`\`\``, inline: true },
                    { name: 'Duration', value: '```\n24 hours maximum\n```', inline: true },
                    {
                        name: 'SSID Expires',
                        value: showDetailedTime
                            ? `\`\`\`\n${remainingHours} hours remaining\n\`\`\``
                            : `\`\`\`\nSSID expires soon: <t:${Math.floor(Date.now() / 1000) + 600}>\n\`\`\``,
                        inline: true
                    }
                ])
        ]
    };
}

module.exports = { quarantinemsg };
