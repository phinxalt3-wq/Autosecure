const { EmbedBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { queryParams } = require("../../../db/database");

async function showproxiespanel(client, userId) {
  const user = await client.users.fetch(userId);  

  const proxiesQuery = await client.queryParams(
    `SELECT proxy FROM proxies WHERE user_id=?`,
    [userId]
  );

  if (!proxiesQuery || proxiesQuery.length === 0) {
    proxiesQuery.push({ proxy: 'No proxies found.' });
  }

  const embed = new EmbedBuilder()
    .setTitle(`${user.tag}'s Proxies Panel`)  
    .setDescription(proxiesQuery.map(p => `- ${p.proxy}`).join('\n'))  
    .setColor(0xADD8E6) 
    .setTimestamp();

  const addButton = new ButtonBuilder()
    .setCustomId('addproxy')
    .setLabel('Add Proxies')
    .setStyle(ButtonStyle.Success);

  const removeproxy = new ButtonBuilder()
    .setCustomId('removeproxies')
    .setLabel('Remove All')
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(addButton, removeproxy);

  const msg = {
    embeds: [embed],
    components: [row],
    ephemeral: true
  };

  return msg;
}

module.exports = showproxiespanel;