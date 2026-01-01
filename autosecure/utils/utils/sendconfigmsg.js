const { queryParams } = require("../../../db/database");
const { autosecureMap } = require("../../../mainbot/handlers/botHandler");
const { saveBotConfig } = require("../bot/configutils");
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = async function sendconfigmsg(user_id, botnumber) {
    let bottag = null;
  //  console.log(`${user_id}`)
    try {
        const result = autosecureMap.get(`${user_id}|${botnumber}`);
        if (result && result.user && result.user.tag) {
            bottag = `(${result.user.tag})`;
        } else {
            // Fallback to database query
            const dbResult = await queryParams(
                `SELECT lastsavedname FROM autosecure WHERE user_id=? AND botnumber=?`, 
                [user_id, botnumber]
            );
            if (dbResult && dbResult.length > 0) {
                bottag = dbResult[0].lastsavedname ? `(${dbResult[0].lastsavedname})` : null;
            }
        }
    } catch (error) {
        console.error(`Error fetching bot tag for user ${user_id} bot ${botnumber}:`, error);
    }

    let config;
    try {
        config = await saveBotConfig(user_id, botnumber);
    } catch (error) {
        console.error(`Failed to save bot config for user ${user_id}:`, error);
        try {
            const failedEmbed = new EmbedBuilder()
                .setTitle('Failed to generate a backup of your bot config, please report this.')
                .setColor('#5f9ea0');
            return { embeds: [failedEmbed] };
        } catch (dmError) {
            console.error(`Failed to create failure embed for user ${user_id}:`, dmError);
            return { content: 'Failed to generate your config backup. Please try again later.' };
        }
    }

    try {
        const buffer = Buffer.from(JSON.stringify(config, null, 2));
        const attachment = new AttachmentBuilder(buffer, { name: `bot${botnumber}|${bottag}_config_${user_id}.json` });
        
        const configEmbed = new EmbedBuilder()
            .setTitle(`Configuration for bot ${botnumber} ${bottag || ''}`)
            .setDescription('Your bot configuration file is attached above.')
            .setColor('#5f9ea0');

        return {
            embeds: [configEmbed],
            files: [attachment]
        };
    } catch (error) {
        console.error(`Failed to prepare config for user ${user_id}:`, error);
        try {
            const failedEmbed = new EmbedBuilder()
                .setTitle('Failed to prepare your config file, please try again later.')
                .setColor('#5f9ea0');
            return { embeds: [failedEmbed] };
        } catch (embedError) {
            console.error(`Failed to create error embed for user ${user_id}:`, embedError);
            return { content: 'An error occurred while preparing your config file.' };
        }
    }
}