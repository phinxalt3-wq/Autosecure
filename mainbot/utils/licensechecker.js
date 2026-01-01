const { queryParams } = require('../../db/database');
const path = require('path');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { sendFullConfigToUser } = require('../../autosecure/utils/bot/configutils'); 
const deleteuser = require('../../db/deleteuser');
const { tablesforuser } = require('../../db/gettablesarray');
const { autosecurelogs } = require('../../autosecure/utils/embeds/autosecurelogs');
const checkroles = require("../../mainbot/utils/checkroles.js")

const delay = "10";

const checkLicenses = async (client) => {
  //  console.log(`Checking licenses, date: ${Date.now()}`)
    const now = Date.now();
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;
    const oneDayFromNow = now + 24 * 60 * 60 * 1000;
    const rows = await queryParams('SELECT * FROM usedLicenses', []);
    
    for (const row of rows) {
        const { license, user_id, expiry, one_day_warning_sent, seven_day_warning_sent, istrial } = row;
        const istrialflag = !!istrial;
        const expiryTime = parseInt(expiry, 10);
        const time = `<t:${Math.floor(expiryTime / 1000)}:R>`;
        

        /// Already expired
        if (expiryTime <= now) {
            try {
                await sendFullConfigToUser(user_id, client, istrialflag);
                await autosecurelogs(null, "config", user_id)
            } catch (error) {
                console.error(`Failed to send full config to user ${user_id} on expiry:`, error);
            }

            const expirationEmbed = new EmbedBuilder()
                .setTitle('Your subscription has expired!')
                .setDescription('Please renew your subscription to regain access.')
                .setColor('#5f9ea0');
            
            try {
                await sendMessageWithEmbed(client, user_id, expirationEmbed);
            } catch (error) {
                console.error(`Failed to send expiration embed to user ${user_id}:`, error);
            }
            
            try {
                await deleteuser(client, user_id);
            } catch (error) {
                console.error(`Failed to delete user ${user_id} after expiry:`, error);
            }


        /// One day left
        } else if (expiryTime <= oneDayFromNow && !one_day_warning_sent) {
            if (istrial) continue; 
            console.log('sending one-day warning!');
            await sendMessage(client, user_id, `Your license will expire ${time}. If you wish to extend your subscription, redeem another license key.`);
            await queryParams('UPDATE usedLicenses SET one_day_warning_sent = 1 WHERE license = ?', [license]);


        // Seven Day Left
        } else if (expiryTime <= sevenDaysFromNow && !seven_day_warning_sent && expiryTime > oneDayFromNow) {
            console.log('sending seven-day warning!');
            await sendMessage(client, user_id, `Your license will expire ${time}. If you wish to extend your subscription, redeem another license key.`);
            await queryParams('UPDATE usedLicenses SET seven_day_warning_sent = 1 WHERE license = ?', [license]);
        }
    }
};

const sendMessage = async (client, userId, message) => {
    try {
        const user = await client.users.fetch(userId);
        if (!user) console.log('User not found');
        await user.send(message);
    } catch (error) {
        console.error(`Failed to send message to user ${userId}:`, error);
    }
};

const sendMessageWithEmbed = async (client, userId, embed) => {
    try {
        const user = await client.users.fetch(userId);
        if (!user) console.log('User not found');
        await user.send({ embeds: [embed] });
    } catch (error) {
        console.error(`Failed to send message with embed to user ${userId}:`, error);
    }
};

/*
Checking user licenses & user and owner roles
*/

const startLicenseChecker = (client) => {
  checkLicenses(client);
  checkroles(client);

  setInterval(() => {
    checkLicenses(client);
  }, parseInt(delay) * 1000); 

  setInterval(() => {
    checkroles(client);
  }, 30 * 60 * 1000); // 30 minutes
};

module.exports = { startLicenseChecker };
