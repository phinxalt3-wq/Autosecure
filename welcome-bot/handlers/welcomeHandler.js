const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const { guildid, welcomechannel, memberrole } = config;

const invites = new Map();

const colorPalette = [
    '#c086cb', '#cefe8f', '#eae4c2', '#87cfd6', '#ef98b7',
    '#b4b1e7', '#ecb387', '#e0b0ab', '#aa8cc1', '#b39be4',
    '#b0b693', '#868ed3', '#b28fef', '#a5d8ff', '#ffb7b2',
    '#9bf6ff', '#fdffb6', '#ffd6a5', '#caffbf', '#ffadad',
    '#bdb2ff', '#ffc6ff', '#fffffc', '#a0c4ff', '#f4a261'
];

const getRandomColor = () => colorPalette[Math.floor(Math.random() * colorPalette.length)];

function setupMemberHandler(client) {
    client.on('ready', async () => {
        for (const guild of client.guilds.cache.values()) {
            try {
                const guildInvites = await guild.invites.fetch();
                invites.set(guild.id, new Map(guildInvites.map(invite => [invite.code, invite.uses])));
            } catch (err) {
                console.error(`MemberHandler|Error|Failed to cache invites for ${guild.name}: ${err.message}`);
            }
        }
    });

    client.on('inviteCreate', async invite => {
        try {
            const guildInvites = invites.get(invite.guild.id) || new Map();
            guildInvites.set(invite.code, invite.uses);
            invites.set(invite.guild.id, guildInvites);
        } catch (err) {
            console.error(`MemberHandler|Error|Failed to cache new invite: ${err.message}`);
        }
    });

    client.on('guildMemberAdd', async member => {
        try {
            if (guildid && member.guild.id !== guildid) return;

            const channel = member.guild.channels.cache.get(welcomechannel);
            if (!channel) {
                console.error(`MemberHandler|Error|Welcome channel ${welcomechannel} not found`);
                return;
            }

            try {
                const role = member.guild.roles.cache.get(memberrole);
                if (!role) {
                    console.error(`MemberHandler|Error|Member role ${memberrole} not found`);
                } else {
                    await member.roles.add(role);
                }
            } catch (roleError) {
                console.error(`MemberHandler|Error|Failed to assign member role: ${roleError.message}`);
            }

            let inviteSource = "vanity";
            try {
                const newInvites = await member.guild.invites.fetch();
                const oldInvites = invites.get(member.guild.id) || new Map();

                const usedInvite = [...newInvites.values()].find(invite => {
                    const oldUses = oldInvites.get(invite.code) || 0;
                    return invite.uses > oldUses;
                });

                invites.set(member.guild.id, new Map(newInvites.map(invite => [invite.code, invite.uses])));

                if (usedInvite) {
                    if (usedInvite.inviter) inviteSource = usedInvite.inviter.tag;
                    else inviteSource = `invite: ${usedInvite.code}`;
                } else if (member.guild.vanityURLCode) {
                    inviteSource = "vanity";
                }
            } catch (err) {
                console.error(`MemberHandler|Error|Failed to track invite: ${err.message}`);
            }

            const configuredBuyChannels = Array.isArray(config.buyChannels) ? config.buyChannels : [];
            const buyMention = configuredBuyChannels.length > 0
                ? configuredBuyChannels.map(id => `<#${id}>`).join(', ')
                : 'Not configured (set buyChannels in config.json)';

            const welcomeEmbed = new EmbedBuilder()
                .setColor(getRandomColor())
                .setTitle(`Welcome ${member.user.username}`)
                .setDescription(`Welcome, <@${member.user.id}>\nBuy channels: ${buyMention}\nYou can now get a free trial using \`/trial\`\nMember count: \`${member.guild.memberCount}\`\nInvited via: \`${inviteSource}\``)
                .setThumbnail(member.user.displayAvatarURL({ extension: 'webp', size: 128 }))
                .setFooter({ text: getFormattedTime() });

            await channel.send({ embeds: [welcomeEmbed] });
        } catch (error) {
            console.error(`MemberHandler|Error|${error.message}`);
        }
    });

    client.on('guildMemberRemove', async member => {
        try {
            if (guildid && member.guild.id !== guildid) return;

            const channel = member.guild.channels.cache.get(welcomechannel);
            if (!channel) {
                console.error(`MemberHandler|Error|Leave channel ${welcomechannel} not found`);
                return;
            }

            const leaveEmbed = new EmbedBuilder()
                .setColor(getRandomColor())
                .setTitle(`${member.user.username} has left the server`)
                .setDescription(`Goodbye, <@${member.user.id}>\nMember count: \`${member.guild.memberCount}\``)
                .setThumbnail(member.user.displayAvatarURL({ extension: 'webp', size: 128 }))
                .setFooter({ text: getFormattedTime() });

            await channel.send({ embeds: [leaveEmbed] });
        } catch (error) {
            console.error(`MemberHandler|Error|${error.message}`, error);
        }
    });
}

function getFormattedTime() {
    const now = new Date();
    const day = String(now.getUTCDate()).padStart(2, '0');
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const year = now.getUTCFullYear();
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
}

module.exports = { setupMemberHandler };
