const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require("../../../config.json");

async function quicksetupmsg(d = false, p = true) {
  const embed = new EmbedBuilder()
    .setTitle('Autosecure First Setup Guide')
    .setColor(15329769)
    .setThumbnail('https://cdn.pfps.gg/pfps/59339-erwan-meunier.gif')
    .addFields(
      {
        name: 'Making your bots',
        value: '• Create a new Discord bot at [The Discord Developer Portal.](https://discord.com/developers/applications)\n• Go to the **Bot** section under settings on the left side.\n• Enable all Privileged Gateway Intents.\n• Click Save & Reset Token.'
      },
      {
        name: 'Setting Up Your Bot',
        value: '\n• Use /bots to add your new bot using the token and manage it on the panel!\n• Need more bots? [Purchase an extra slot.](' + config.botslotslink + ')'
      },
      {
        name: 'Settings server & channels',
        value: '\n• Use /set to set all the channels\n• Server, Logs and Hits are mandatory, see the button below for more info.'
      },
      {
        name: `Guide (Create & Setup Bot and Manage settings with examples)`,
        value: `https://www.youtube.com/watch?v=r5kNwO-Ta8w`
      }
    );

    if (p){
      embed.setFooter({
      text: `Use /guides for more info.`
    })
    }

  const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('seecommands')
        .setLabel('Commands')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('seeverification')
        .setLabel('Verification Options')
        .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
        .setCustomId('seechannels')
        .setLabel('Channels')
        .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
        .setCustomId('seeclaiming')
        .setLabel('Claiming')
        .setStyle(ButtonStyle.Secondary)
    );

    return {
      content: null,
      embeds: [embed],
      components: [buttons],
      ephemeral: d ? true : false  
    };
}

module.exports = quicksetupmsg;
