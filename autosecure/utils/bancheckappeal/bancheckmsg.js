const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { bancheck } = require('./bancheck');
const { queryParams } = require('../../../db/database');
const generate = require('../generate');

module.exports = async function bancheckmsg(ssid) {
  if (!ssid || ssid.length < 8) {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(0xff4757)
          .setTitle('❌ Invalid Input')
          .setDescription('Please provide a valid SSID (minimum 8 characters).')
          .setThumbnail('https://cdn.pfps.gg/pfps/59339-erwan-meunier.gif')
          .setFooter({ text: 'Ban Checker • Autosecure' })
          .setTimestamp()
      ],
      components: []
    };
  }

  const result = await bancheck(ssid);
  const username = result.username || 'Unknown Account';

  const embed = new EmbedBuilder()
    .setTitle(`🔍 Ban Status Check`)
    .setThumbnail(`https://visage.surgeplay.com/bust/${username}.png?y=-40`)
    .setColor(0x2f3542)
    .setFooter({ text: `Checked for ${username} • Autosecure` })
    .setTimestamp();

  let components = [];

  if (result.banReason === 'invalid_token') {
    embed.setColor(0xff4757)
         .setTitle('❌ Invalid SSID')
         .setDescription('The provided SSID is invalid or has expired.')
         .addFields({
           name: '💡 What to do?',
           value: '• Make sure the SSID is correct\n• Check if the SSID is still valid\n• Try generating a new SSID',
           inline: false
         });
    return {
      embeds: [embed],
      components
    };
  }

  if (typeof result.ban === 'string' && result.ban.startsWith("Couldn't check ban:")) {
    embed.setColor(0xffa502)
         .setTitle('⚠️ Check Failed')
         .setDescription(`Unable to check ban status: \`${result.banReason || "Unknown error"}\``)
         .addFields({
           name: '🔄 Try Again',
           value: 'The server might be temporarily unavailable. Please try again in a few moments.',
           inline: false
         });
    return {
      embeds: [embed],
      components
    };
  }

  if (result.ban === true) {
    embed.setColor(0xff4757)
         .setTitle('🚫 Account Banned')
         .setDescription(`**${username}** is currently banned on Hypixel`)
         .addFields(
           {
             name: '👤 Username',
             value: `\`${username}\``,
             inline: true
           },
           {
             name: '📊 Status',
             value: '🔴 **Banned**',
             inline: true
           },
           {
             name: '📝 Reason',
             value: `\`${result.banReason || "Unknown"}\``,
             inline: true
           }
         );

    if (result.banId) {
      embed.addFields({
        name: '🆔 Ban ID',
        value: `\`${result.banId.toUpperCase()}\``,
        inline: true
      });
    }

    if (result.unbanTime) {
      embed.addFields({
        name: '⏰ Unban Time',
        value: result.unbanTime === 'never' ? '🔒 **Permanent**' : `<t:${Math.floor(result.unbanTime)}:R>`,
        inline: true
      });
    }

    embed.addFields({
      name: 'ℹ️ Additional Info',
      value: 'This account cannot be used on Hypixel until the ban is lifted.',
      inline: false
    });

    // Add appeal button for permanent bans
    if (result.unbanTime === 'never') {
      const id = generate(32);
      await queryParams(
        `INSERT INTO actions (id,action) VALUES (?,?)`,
        [id, `appeal|${ssid}`]
      );

      const appealButton = new ButtonBuilder()
        .setCustomId(`appeal|${id}`)
        .setLabel('📝 Appeal Ban')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('📝');

      components = [new ActionRowBuilder().addComponents(appealButton)];
    }
  } else if (result.ban === false) {
    embed.setColor(0x2ed573)
         .setTitle('✅ Account Clean')
         .setDescription(`**${username}** is not banned on Hypixel`)
         .addFields(
           {
             name: '👤 Username',
             value: `\`${username}\``,
             inline: true
           },
           {
             name: '📊 Status',
             value: '🟢 **Unbanned**',
             inline: true
           },
           {
             name: '🎮 Access',
             value: 'This account can be used on Hypixel',
             inline: true
           }
         );
  } else {
    embed.setColor(0x747d8c)
         .setTitle('❓ Status Unknown')
         .setDescription(`Unable to determine the ban status for **${username}**`)
         .addFields(
           {
             name: '👤 Username',
             value: `\`${username}\``,
             inline: true
           },
           {
             name: '📊 Status',
             value: '🟡 **Unknown**',
             inline: true
           },
           {
             name: '💡 Suggestion',
             value: 'Try checking again later or verify the SSID is correct',
             inline: false
           }
         );
  }

  return {
    embeds: [embed],
    components
  };
};
